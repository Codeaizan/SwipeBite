import { PlaceHolderImages } from '@/lib/placeholder-images';

export interface FoodItem {
  id: string;
  name: string;
  kiosk: 'Kiosk A' | 'Kiosk B' | 'Kiosk C';
  location: string;
  price: number;
  isVeg: boolean;
  imageUrl: string;
  likes: number;
  totalSwipes: number;
  rankChange: number;
}

const KIOSK_NAMES = {
  'Kiosk A': 'North Campus',
  'Kiosk B': 'Main Block',
  'Kiosk C': 'Hostel Block',
} as const;

export const foodItems: FoodItem[] = [
  { id: '1', name: 'Chole Bhature', kiosk: 'Kiosk A', location: KIOSK_NAMES['Kiosk A'], price: 80, isVeg: true, imageUrl: PlaceHolderImages[0].imageUrl, likes: 245, totalSwipes: 310, rankChange: 2 },
  { id: '2', name: 'Maggi', kiosk: 'Kiosk B', location: KIOSK_NAMES['Kiosk B'], price: 40, isVeg: true, imageUrl: PlaceHolderImages[1].imageUrl, likes: 180, totalSwipes: 250, rankChange: -1 },
  { id: '3', name: 'Veg Burger', kiosk: 'Kiosk C', location: KIOSK_NAMES['Kiosk C'], price: 60, isVeg: true, imageUrl: PlaceHolderImages[2].imageUrl, likes: 150, totalSwipes: 220, rankChange: 1 },
  { id: '4', name: 'Paneer Roll', kiosk: 'Kiosk A', location: KIOSK_NAMES['Kiosk A'], price: 70, isVeg: true, imageUrl: PlaceHolderImages[3].imageUrl, likes: 190, totalSwipes: 280, rankChange: 3 },
  { id: '5', name: 'Chicken Sandwich', kiosk: 'Kiosk B', location: KIOSK_NAMES['Kiosk B'], price: 90, isVeg: false, imageUrl: PlaceHolderImages[4].imageUrl, likes: 210, totalSwipes: 295, rankChange: 0 },
  { id: '6', name: 'Samosa', kiosk: 'Kiosk C', location: KIOSK_NAMES['Kiosk C'], price: 15, isVeg: true, imageUrl: PlaceHolderImages[5].imageUrl, likes: 120, totalSwipes: 180, rankChange: -2 },
  { id: '7', name: 'Cold Coffee', kiosk: 'Kiosk A', location: KIOSK_NAMES['Kiosk A'], price: 50, isVeg: true, imageUrl: PlaceHolderImages[6].imageUrl, likes: 280, totalSwipes: 350, rankChange: 1 },
  { id: '8', name: 'Pasta', kiosk: 'Kiosk B', location: KIOSK_NAMES['Kiosk B'], price: 85, isVeg: true, imageUrl: PlaceHolderImages[7].imageUrl, likes: 140, totalSwipes: 210, rankChange: 2 },
  { id: '9', name: 'Aloo Paratha', kiosk: 'Kiosk C', location: KIOSK_NAMES['Kiosk C'], price: 45, isVeg: true, imageUrl: PlaceHolderImages[8].imageUrl, likes: 165, totalSwipes: 230, rankChange: -1 },
  { id: '10', name: 'Chicken Roll', kiosk: 'Kiosk A', location: KIOSK_NAMES['Kiosk A'], price: 95, isVeg: false, imageUrl: PlaceHolderImages[9].imageUrl, likes: 230, totalSwipes: 320, rankChange: 4 },
  { id: '11', name: 'Masala Chai', kiosk: 'Kiosk B', location: KIOSK_NAMES['Kiosk B'], price: 20, isVeg: true, imageUrl: PlaceHolderImages[10].imageUrl, likes: 300, totalSwipes: 400, rankChange: 0 },
  { id: '12', name: 'French Fries', kiosk: 'Kiosk C', location: KIOSK_NAMES['Kiosk C'], price: 55, isVeg: true, imageUrl: PlaceHolderImages[11].imageUrl, likes: 175, totalSwipes: 260, rankChange: 1 },
  { id: '13', name: 'Rajma Chawal', kiosk: 'Kiosk A', location: KIOSK_NAMES['Kiosk A'], price: 75, isVeg: true, imageUrl: PlaceHolderImages[12].imageUrl, likes: 195, totalSwipes: 275, rankChange: -2 },
  { id: '14', name: 'Egg Bhurji', kiosk: 'Kiosk B', location: KIOSK_NAMES['Kiosk B'], price: 50, isVeg: false, imageUrl: PlaceHolderImages[13].imageUrl, likes: 130, totalSwipes: 190, rankChange: 1 },
  { id: '15', name: 'Chocolate Shake', kiosk: 'Kiosk C', location: KIOSK_NAMES['Kiosk C'], price: 65, isVeg: true, imageUrl: PlaceHolderImages[14].imageUrl, likes: 260, totalSwipes: 330, rankChange: 3 },
];
