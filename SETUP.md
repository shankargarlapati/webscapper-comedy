# Quick Setup Guide

## What You Need

To run Singular, you'll need three API keys:

1. **Google Places API Key** - For finding comedy venues
2. **OpenAI API Key** - For AI classification
3. **Firecrawl API Key** - For scraping venue websites

## Step 1: Get Google Places API Key

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Places API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Places API"
   - Click "Enable"
4. Create an API Key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key
5. (Optional but recommended) Restrict the key:
   - Click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API"

## Step 2: Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy your API key (you won't be able to see it again)
6. Add credits to your account if needed

## Step 3: Get Firecrawl API Key

1. Visit [Firecrawl](https://www.firecrawl.dev/)
2. Sign up for an account
3. Go to your dashboard and find API Keys
4. Copy your API key
5. Note: Firecrawl offers free tier requests for scraping

## Step 4: Configure Supabase Secrets

The Edge Function needs these API keys configured as secrets in your Supabase project.

You'll need to add these as environment variables:
- `GOOGLE_PLACES_API_KEY`
- `OPENAI_API_KEY`
- `FIRECRAWL_API_KEY`

## Step 5: Test the App

Once configured, test by:
1. Click "Find Comedy Tonight"
2. Allow location access (or enter a LA zip code like 90028)
3. Wait for results
4. You should see 4 cards with comedy recommendations

## Costs

- **Google Places API**: ~$0.032 per request (includes nearby search)
- **OpenAI API**: ~$0.001-0.002 per classification (using GPT-4o-mini)
- **Firecrawl**: Free tier includes requests (paid plans start at $99/month)
- **Supabase**: Database storage minimal for cached data

With Firecrawl free tier, typical cost per unique user search: **$0.033-0.034**

## Troubleshooting

**"API keys not configured" error**
- Make sure both API keys are set in Supabase Edge Function secrets

**"No comedy venues found"**
- Check that the location is within or near Los Angeles
- Verify Google Places API is enabled

**"Unable to find comedy events"**
- Check browser console for detailed error messages
- Verify API keys are valid and have credits
