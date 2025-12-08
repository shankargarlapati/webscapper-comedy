export type ComedyCategory =
  | 'Comedy Workshop'
  | 'Comedy Podcasts'
  | 'Stand-Up Comedy Club'
  | 'Improv Comedy Leaders';

export interface ComedyEvent {
  category: ComedyCategory;
  venueName: string;
  eventTitle: string;
  distance: number;
  aiReasoning: string;
  placeId?: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
}
