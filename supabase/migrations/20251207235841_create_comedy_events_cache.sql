/*
  # Comedy Events Cache Schema

  1. New Tables
    - `comedy_events_cache`
      - `id` (uuid, primary key)
      - `location_hash` (text) - hashed lat/lng for cache lookup
      - `category` (text) - one of the 4 comedy categories
      - `venue_name` (text)
      - `event_title` (text)
      - `description` (text)
      - `distance_miles` (numeric)
      - `rating` (numeric)
      - `user_ratings_total` (integer)
      - `address` (text)
      - `place_id` (text) - Google Places ID
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `ai_reasoning` (text) - why it's the best
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz) - cache expiration (10 minutes)
  
  2. Security
    - Enable RLS on `comedy_events_cache` table
    - Allow public read access for cached data (since it's all public venue info)
    - Only Edge Functions can insert/update via service role key

  3. Indexes
    - Index on location_hash and category for fast cache lookups
    - Index on expires_at for cleaning old data
*/

CREATE TABLE IF NOT EXISTS comedy_events_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_hash text NOT NULL,
  category text NOT NULL,
  venue_name text NOT NULL,
  event_title text DEFAULT '',
  description text DEFAULT '',
  distance_miles numeric NOT NULL,
  rating numeric DEFAULT 0,
  user_ratings_total integer DEFAULT 0,
  address text DEFAULT '',
  place_id text DEFAULT '',
  latitude numeric,
  longitude numeric,
  ai_reasoning text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE comedy_events_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comedy event cache"
  ON comedy_events_cache
  FOR SELECT
  TO anon
  USING (expires_at > now());

CREATE INDEX IF NOT EXISTS idx_location_category 
  ON comedy_events_cache(location_hash, category);

CREATE INDEX IF NOT EXISTS idx_expires_at 
  ON comedy_events_cache(expires_at);
