import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScrapedEvent {
  title: string;
  description: string;
  startTime?: string;
  price?: string;
  performers?: string;
  url?: string;
}

interface ComedyEvent {
  category: string;
  venueName: string;
  eventTitle: string;
  description?: string;
  distance: number;
  aiReasoning: string;
  placeId?: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  price?: string;
  performers?: string;
  eventUrl?: string;
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

async function queryGooglePlaces(apiKey: string, lat: number, lng: number): Promise<any[]> {
  const queries = ["comedy club", "comedy show", "improv", "stand up comedy"];
  const allPlaces: any[] = [];
  const seenPlaceIds = new Set<string>();

  console.log(`Querying Google Places API for lat: ${lat}, lng: ${lng}`);

  for (const query of queries) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=16093&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
    
    console.log(`Searching for: ${query}`);
    const response = await fetch(url);
    const data = await response.json();

    console.log(`Response status for "${query}": ${data.status}, results: ${data.results?.length || 0}`);

    if (data.results) {
      for (const place of data.results) {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          allPlaces.push(place);
        }
      }
    }
  }

  console.log(`Total unique places found: ${allPlaces.length}`);
  return allPlaces;
}

async function scrapeVenueWithFirecrawl(
  firecrawlKey: string,
  url: string,
  venueName: string
): Promise<ScrapedEvent[]> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v0/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        formats: ["markdown"],
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl scrape failed for ${url}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.markdown || data.content || "";

    const events = extractEventsFromContent(content, venueName);
    return events;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return [];
  }
}

function extractEventsFromContent(content: string, venueName: string): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];

  const lines = content.split("\n");
  let currentEvent: Partial<ScrapedEvent> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (
      trimmed.match(/^#{1,3}\s+/i) ||
      trimmed.match(/^\*{2,}/i) ||
      trimmed.match(/show|event|performance|tonight/i)
    ) {
      if (currentEvent && currentEvent.title) {
        events.push({
          title: currentEvent.title || "Comedy Show",
          description: currentEvent.description || "",
          startTime: currentEvent.startTime,
          price: currentEvent.price,
          performers: currentEvent.performers,
          url: currentEvent.url,
        });
      }

      currentEvent = {
        title: trimmed.replace(/^[#*]+\s*/g, ""),
        description: "",
      };
    } else if (currentEvent) {
      const priceMatch = trimmed.match(/\$(\d+[.,]?\d*)|free|complimentary/i);
      if (priceMatch) {
        currentEvent.price = priceMatch[0];
      }

      const timeMatch = trimmed.match(
        /(\d{1,2})[:\.]?(\d{2})?\s*(am|pm)?\s*-?\s*(\d{1,2})?[:\.]?(\d{2})?\s*(am|pm)?/i
      );
      if (timeMatch && !currentEvent.startTime) {
        currentEvent.startTime = trimmed;
      }

      if (currentEvent.description && currentEvent.description.length < 200) {
        currentEvent.description += (currentEvent.description ? " " : "") + trimmed;
      }
    }
  }

  if (currentEvent && currentEvent.title) {
    events.push({
      title: currentEvent.title || "Comedy Show",
      description: currentEvent.description || "",
      startTime: currentEvent.startTime,
      price: currentEvent.price,
      performers: currentEvent.performers,
      url: currentEvent.url,
    });
  }

  return events.length > 0 ? events : [{
    title: "Live Comedy Events",
    description: `Check ${venueName} for tonight's shows`,
  }];
}

async function classifyEventsWithAI(
  openaiKey: string,
  events: any[],
  userLat: number,
  userLng: number
): Promise<ComedyEvent[]> {
  const eventsInfo = events.map((e) => ({
    venueName: e.venueName,
    eventTitle: e.eventTitle,
    description: e.description || "",
    rating: e.rating,
    proximity: e.distance,
    venueName_and_event: `${e.venueName} - ${e.eventTitle}`,
  }));

  const prompt = `You are a comedy expert. Classify these venues/events into ONE category each:

Categories:
1. Comedy Workshop - classes, open mics, development workshops
2. Comedy Podcasts - live podcast tapings, comedic talk shows
3. Stand-Up Comedy Club - pro showcases, headliners, traditional stand-up
4. Improv Comedy Leaders - improv troupes, improv houses, sketch shows

Venues/Events:
${JSON.stringify(eventsInfo, null, 2)}

For EACH venue, pick the BEST single category and provide a brief, compelling one-sentence reason why.

Respond with ONLY valid JSON in this exact format:
{
  "classifications": [
    {"venueName_and_event": "...", "category": "...", "reasoning": "one sentence why"},
    {"venueName_and_event": "...", "category": "...", "reasoning": "one sentence why"}
  ]
}

Do not include any text outside the JSON.`;

  try {
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    if (!aiData.choices || !aiData.choices[0]) {
      throw new Error("Invalid OpenAI response");
    }

    const content = aiData.choices[0].message.content.trim();
    const parsed = JSON.parse(content);
    const classifications = parsed.classifications || [];

    const categorizedEvents: ComedyEvent[] = [];

    for (const classification of classifications) {
      const originalEvent = events.find(
        (e) => `${e.venueName} - ${e.eventTitle}` === classification.venueName_and_event
      );

      if (originalEvent && CATEGORIES.includes(classification.category)) {
        categorizedEvents.push({
          ...originalEvent,
          category: classification.category,
          aiReasoning: classification.reasoning,
        });
      }
    }

    return categorizedEvents;
  } catch (error) {
    console.error("AI classification error:", error);
    return [];
  }
}

async function selectBestPerCategory(events: ComedyEvent[]): Promise<ComedyEvent[]> {
  const categorized: Record<string, ComedyEvent[]> = {};

  for (const event of events) {
    if (!categorized[event.category]) {
      categorized[event.category] = [];
    }
    categorized[event.category].push(event);
  }

  const results: ComedyEvent[] = [];

  for (const category of CATEGORIES) {
    const categoryEvents = categorized[category] || [];
    if (categoryEvents.length > 0) {
      const best = categoryEvents.reduce((prev, current) => {
        const prevScore = (prev.rating || 0) - (prev.distance * 0.1);
        const currentScore = (current.rating || 0) - (current.distance * 0.1);
        return currentScore > prevScore ? current : prev;
      });
      results.push(best);
    }
  }

  return results;
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
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    console.log("API Keys status:", {
      googleApiKey: googleApiKey ? `Present (${googleApiKey.substring(0, 10)}...)` : "Missing",
      openaiKey: openaiKey ? `Present (${openaiKey.substring(0, 15)}...)` : "Missing",
      firecrawlKey: firecrawlKey ? `Present (${firecrawlKey.substring(0, 10)}...)` : "Missing"
    });

    if (!googleApiKey || !openaiKey) {
      return new Response(
        JSON.stringify({
          error: "API keys not configured. Please set GOOGLE_PLACES_API_KEY, OPENAI_API_KEY, and FIRECRAWL_API_KEY.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const allEvents: any[] = [];

    for (const place of places.slice(0, 10)) {
      const distance = calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng);

      if (distance > 10) continue;

      const venueRow = {
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        website: place.website || "",
        rating: place.rating || 0,
        user_ratings_total: place.user_ratings_total || 0,
        phone: place.formatted_phone_number || "",
        types: place.types || [],
      };

      await supabase.from("comedy_venues").upsert([venueRow], { onConflict: "place_id" });

      let scrapedEvents: ScrapedEvent[] = [];

      if (firecrawlKey && place.website) {
        scrapedEvents = await scrapeVenueWithFirecrawl(
          firecrawlKey,
          place.website,
          place.name
        );
      }

      if (scrapedEvents.length === 0) {
        scrapedEvents = [{
          title: "Live Comedy Events",
          description: `Check ${place.name} for tonight's shows`,
        }];
      }

      for (const scrapedEvent of scrapedEvents.slice(0, 2)) {
        const eventRow = {
          title: scrapedEvent.title,
          description: scrapedEvent.description || "",
          start_time: scrapedEvent.startTime,
          price: scrapedEvent.price,
          performers: scrapedEvent.performers,
          url: scrapedEvent.url,
          source_url: place.website,
        };

        allEvents.push({
          venueName: place.name,
          eventTitle: scrapedEvent.title,
          description: scrapedEvent.description || "",
          placeId: place.place_id,
          address: place.vicinity,
          distance: distance,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          price: scrapedEvent.price,
          performers: scrapedEvent.performers,
          eventUrl: scrapedEvent.url,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        });
      }
    }

    if (allEvents.length === 0) {
      return new Response(
        JSON.stringify({ error: "No events found or couldn't scrape venue data" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const classifiedEvents = await classifyEventsWithAI(openaiKey, allEvents, latitude, longitude);

    if (classifiedEvents.length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not classify events" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const finalResults = await selectBestPerCategory(classifiedEvents);

    return new Response(
      JSON.stringify({ events: finalResults, cached: false }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});