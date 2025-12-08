export type ComedyCategory =
  | 'Comedy Workshop'
  | 'Comedy Podcasts'
  | 'Stand-Up Comedy Club'
  | 'Improv Comedy Leaders';

export interface ComedyVenue {
  id?: string;
  placeId?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  website?: string;
  rating: number;
  userRatingsTotal: number;
  phone?: string;
  distance: number;
}

export interface ComedyEvent {
  id?: string;
  category: ComedyCategory;
  venueName: string;
  venue?: ComedyVenue;
  eventTitle: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  distance: number;
  aiReasoning: string;
  price?: string;
  performers?: string;
  eventUrl?: string;
  placeId?: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
}
