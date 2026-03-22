export interface FoodItem {
  id: string;
  name: string;
  kiosk: string;
  location: string;
  price: number;
  isVeg: boolean;
  imageUrl: string;
  isAvailable?: boolean;
  isSpecial?: boolean;
  cuisine?: string;
}
