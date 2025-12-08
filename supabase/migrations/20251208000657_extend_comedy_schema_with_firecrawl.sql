/*
  # Extended Comedy Events Schema with Firecrawl Data

  1. New Tables
    - `comedy_venues` - Store venue information from scraped data
      - `id` (uuid, primary key)
      - `place_id` (text) - Google Places ID
      - `name` (text) - Venue name
      - `address` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `website` (text) - Venue website URL for Firecrawl
      - `rating` (numeric)
      - `user_ratings_total` (integer)
      - `phone` (text)
      - `types` (text array) - Google Places types
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `comedy_events` - Store individual events from Firecrawl scraping
      - `id` (uuid, primary key)
      - `venue_id` (uuid, foreign key)
      - `title` (text) - Event title/show name
      - `description` (text) - Full event description
      - `start_time` (timestamptz) - When the show starts
      - `end_time` (timestamptz) - When the show ends
      - `url` (text) - Link to event booking/details
      - `price` (text) - Ticket price information
      - `capacity` (integer)
      - `performers` (text) - Comma-separated performer names
      - `ai_category` (text) - AI-classified category
      - `raw_scraped_content` (text) - Raw HTML/text from Firecrawl
      - `source_url` (text) - URL where event was scraped from
      - `created_at` (timestamptz)
      - `scraped_at` (timestamptz)

    - `scrape_jobs` - Track Firecrawl scraping jobs
      - `id` (uuid, primary key)
      - `url` (text) - URL being scraped
      - `status` (text) - pending, completed, failed
      - `firecrawl_job_id` (text)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `expires_at` (timestamptz) - When to re-scrape

  2. Security
    - Enable RLS on all tables
    - Allow public read access for event data (all public)
    - Only Edge Functions can insert/update via service role

  3. Indexes
    - Index on venue_id in events table
    - Index on start_time for date-based queries
    - Index on ai_category for filtering
    - Index on expires_at in scrape_jobs
*/

CREATE TABLE IF NOT EXISTS comedy_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text UNIQUE,
  name text NOT NULL,
  address text,
  latitude numeric,
  longitude numeric,
  website text,
  rating numeric DEFAULT 0,
  user_ratings_total integer DEFAULT 0,
  phone text,
  types text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comedy_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comedy venues"
  ON comedy_venues
  FOR SELECT
  TO anon
  USING (true);

CREATE TABLE IF NOT EXISTS comedy_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES comedy_venues(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  start_time timestamptz,
  end_time timestamptz,
  url text,
  price text,
  capacity integer,
  performers text,
  ai_category text,
  raw_scraped_content text,
  source_url text,
  created_at timestamptz DEFAULT now(),
  scraped_at timestamptz DEFAULT now()
);

ALTER TABLE comedy_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comedy events"
  ON comedy_events
  FOR SELECT
  TO anon
  USING (true);

CREATE TABLE IF NOT EXISTS scrape_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  status text DEFAULT 'pending',
  firecrawl_job_id text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scrape jobs"
  ON scrape_jobs
  FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_comedy_events_venue_id 
  ON comedy_events(venue_id);

CREATE INDEX IF NOT EXISTS idx_comedy_events_start_time 
  ON comedy_events(start_time);

CREATE INDEX IF NOT EXISTS idx_comedy_events_category 
  ON comedy_events(ai_category);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_expires_at 
  ON scrape_jobs(expires_at);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_url 
  ON scrape_jobs(url);
