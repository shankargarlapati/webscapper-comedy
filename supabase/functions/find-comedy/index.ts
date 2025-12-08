import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ComedyEvent {
  category: string;
  venueName: string;
  eventTitle: string;
  distance: number;
  aiReasoning: string;
  placeId?: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  latitude?: number;
  longitude?: number;
}

const CATEGORIES = [
  "Comedy Workshop",
  "Comedy Podcasts",
  "Stand-Up Comedy Club",
  "Improv Comedy Leaders",
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createLocationHash(lat: number, lng: number): string {
  return `${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

async function checkCache(supabase: any, locationHash: string): Promise<ComedyEvent[] | null> {
  const { data, error } = await supabase
    .from("comedy_events_cache")
    .select("*")
    .eq("location_hash", locationHash)
    .gt("expires_at", new Date().toISOString());

  if (error || !data || data.length === 0) {
    return null;
  }

  const events: ComedyEvent[] = data.map((row: any) => ({
    category: row.category,
    venueName: row.venue_name,
    eventTitle: row.event_title,
    distance: parseFloat(row.distance_miles),
    aiReasoning: row.ai_reasoning,
    placeId: row.place_id,
    address: row.address,
    rating: row.rating ? parseFloat(row.rating) : undefined,
    userRatingsTotal: row.user_ratings_total,
  }));

  return events.length === CATEGORIES.length ? events : null;
}

async function saveToCache(supabase: any, locationHash: string, events: ComedyEvent[]) {
  const rows = events.map((event) => ({
    location_hash: locationHash,
    category: event.category,
    venue_name: event.venueName,
    event_title: event.eventTitle,
    description: "",
    distance_miles: event.distance,
    rating: event.rating || 0,
    user_ratings_total: event.userRatingsTotal || 0,
    address: event.address || "",
    place_id: event.placeId || "",
    latitude: event.latitude,
    longitude: event.longitude,
    ai_reasoning: event.aiReasoning,
  }));

  await supabase.from("comedy_events_cache").insert(rows);
}

async function queryGooglePlaces(apiKey: string, lat: number, lng: number): Promise<any[]> {
  const queries = ["comedy club", "comedy show", "improv", "stand up comedy"];
  const allPlaces: any[] = [];
  const seenPlaceIds = new Set<string>();

  for (const query of queries) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=16093&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.results) {
      for (const place of data.results) {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          allPlaces.push(place);
        }
      }
    }
  }

  return allPlaces;
}

async function classifyWithAI(openaiKey: string, places: any[], userLat: number, userLng: number): Promise<ComedyEvent[]> {
  const placesInfo = places.map((p) => ({
    name: p.name,
    types: p.types,
    vicinity: p.vicinity,
    rating: p.rating,
    user_ratings_total: p.user_ratings_total,
    place_id: p.place_id,
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
    distance: calculateDistance(userLat, userLng, p.geometry.location.lat, p.geometry.location.lng),
  }));

  const prompt = `You are a comedy expert. Analyze these venues and classify each into EXACTLY ONE category:

Categories:
1. Comedy Workshop - classes, open mics, development workshops
2. Comedy Podcasts - live podcast tapings, comedic talk shows
3. Stand-Up Comedy Club - pro showcases, headliners, traditional stand-up
4. Improv Comedy Leaders - improv troupes, improv houses, sketch shows

Venues:
${JSON.stringify(placesInfo, null, 2)}

For EACH of the 4 categories, select the single BEST venue based on:
- Relevance to category
- Rating and reviews
- Quality implied by name/description
- Proximity to user (lower distance is better)

Respond with ONLY valid JSON in this exact format:
{
  "Comedy Workshop": {"place_id": "...", "reasoning": "one sentence why it's best"},
  "Comedy Podcasts": {"place_id": "...", "reasoning": "one sentence why it's best"},
  "Stand-Up Comedy Club": {"place_id": "...", "reasoning": "one sentence why it's best"},
  "Improv Comedy Leaders": {"place_id": "...", "reasoning": "one sentence why it's best"}
}

If no good match exists for a category, use null for that category. Do not include any text outside the JSON.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a comedy venue classification expert. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  const aiData = await response.json();
  const content = aiData.choices[0].message.content.trim();
  const classifications = JSON.parse(content);

  const events: ComedyEvent[] = [];
  const placeMap = new Map(places.map((p) => [p.place_id, p]));

  for (const category of CATEGORIES) {
    const classification = classifications[category];
    if (classification && classification.place_id) {
      const place = placeMap.get(classification.place_id);
      if (place) {
        events.push({
          category,
          venueName: place.name,
          eventTitle: "",
          distance: calculateDistance(userLat, userLng, place.geometry.location.lat, place.geometry.location.lng),
          aiReasoning: classification.reasoning,
          placeId: place.place_id,
          address: place.vicinity,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        });
      }
    }
  }

  return events;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Missing latitude or longitude" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!googleApiKey || !openaiKey) {
      return new Response(
        JSON.stringify({ error: "API keys not configured. Please set GOOGLE_PLACES_API_KEY and OPENAI_API_KEY." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const locationHash = createLocationHash(latitude, longitude);

    const cachedEvents = await checkCache(supabase, locationHash);
    if (cachedEvents) {
      return new Response(
        JSON.stringify({ events: cachedEvents, cached: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const places = await queryGooglePlaces(googleApiKey, latitude, longitude);

    if (places.length === 0) {
      return new Response(
        JSON.stringify({ error: "No comedy venues found in your area" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const events = await classifyWithAI(openaiKey, places, latitude, longitude);
    await saveToCache(supabase, locationHash, events);

    return new Response(
      JSON.stringify({ events, cached: false }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});