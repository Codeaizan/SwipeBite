export type SwipeDirection = 'left' | 'right' | 'up';

export interface SwipeDoc {
  id: string;
  userId: string;
  itemId: string;
  direction: SwipeDirection;
  timestamp?: unknown;
}

export interface KioskDoc {
  id: string;
  name: string;
  location: string;
  ownerUid?: string;
  ownerEmail?: string;
  createdAt?: unknown;
}

export type UserRole = 'student' | 'kioskOwner' | 'superAdmin';

export interface UserDoc {
  id: string;
  role: UserRole;
  kioskId?: string;
  kioskName?: string;
  email?: string;
  displayName?: string;
  createdAt?: unknown;
}

export interface SuggestionDoc {
  id: string;
  text: string;
  userId: string;
  createdAt?: unknown;
  status: 'pending' | 'forwarded' | 'rejected';
  forwardedTo: string[]; // array of kiosk names (acting as IDs)
}

export interface GlobalConfigDoc {
  id?: string;
  suggestionCharLimit: number;
}