# Singular

A minimal web app that helps users instantly discover the best comedy happening tonight in Los Angeles.

## Features

- **One-Click Discovery**: Find comedy with a single button press
- **Geolocation Support**: Automatically uses your location, with zip code fallback
- **AI-Powered Classification**: Intelligently categorizes venues into 4 comedy types
- **Curated Results**: Shows only the #1 best pick per category
- **10-Minute Caching**: Fast results without redundant API calls
- **Dark Mode UI**: Beautiful, minimal, mobile-first design

## Comedy Categories

1. **Comedy Workshop** - Classes, open mics, development workshops
2. **Comedy Podcasts** - Live podcast tapings, comedic talk shows
3. **Stand-Up Comedy Club** - Pro showcases, headliners, traditional stand-up
4. **Improv Comedy Leaders** - Improv troupes, improv houses, sketch shows

## Setup Instructions

### Prerequisites

- Supabase account
- Google Places API key
- OpenAI API key

### 1. Environment Variables

Create a `.env` file based on `.env.example`:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. API Keys Configuration

You need to configure the following secrets in your Supabase project:

- `GOOGLE_PLACES_API_KEY` - Get from [Google Cloud Console](https://console.cloud.google.com/)
- `OPENAI_API_KEY` - Get from [OpenAI Platform](https://platform.openai.com/)

### 3. Google Places API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Places API"
4. Create credentials (API Key)
5. Restrict the key to Places API only

### 4. Database Migration

The database schema is already applied via Supabase migrations. It creates a `comedy_events_cache` table for caching results.

### 5. Edge Function

The `find-comedy` Edge Function is already deployed and handles:
- Querying Google Places API
- AI classification with OpenAI
- Caching logic
- Results ranking

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase (PostgreSQL)
- **APIs**: Google Places API, OpenAI API
- **Icons**: Lucide React

## Architecture

```
User → Landing Page → Geolocation/Zip
                ↓
        Edge Function (find-comedy)
                ↓
    Check Cache → [Hit] → Return Cached
                ↓ [Miss]
        Google Places API
                ↓
        OpenAI Classification
                ↓
        Rank & Select Top Picks
                ↓
        Save to Cache → Return Results
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

This app is designed to be deployed on platforms like Vercel, Netlify, or any static hosting service with Supabase as the backend.

## Future Enhancements

- Add "tonight" time filtering for actual event times
- Deep-link directly to venue booking pages
- Support for more cities beyond LA
- User favorites and history
- Social sharing of recommendations
