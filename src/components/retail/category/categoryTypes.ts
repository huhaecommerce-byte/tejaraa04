export interface RetailCategoryChild {
  name: string;
  cnt: number;
}

export interface RetailCategoryGroup {
  name: string;
  cnt: number;
  subs: RetailCategoryChild[];
}

export const categoryImageFor = (name: string) => {
  const value = name.toLowerCase();
  if (value.includes('mobile') || value.includes('phone')) return '/marketplace/mobile.jpg';
  if (value.includes('electronic') || value.includes('computer') || value.includes('audio') || value.includes('tv')) return '/marketplace/electronics.jpg';
  if (value.includes('home') || value.includes('kitchen') || value.includes('furniture') || value.includes('decor')) return '/marketplace/home.jpg';
  if (value.includes('beauty') || value.includes('care') || value.includes('health')) return '/marketplace/beauty.jpg';
  if (value.includes('fashion') || value.includes('women') || value.includes('men') || value.includes('kid')) return '/marketplace/fashion.jpg';
  if (value.includes('sport') || value.includes('fitness')) return '/marketplace/sports.jpg';
  if (value.includes('auto') || value.includes('car')) return '/marketplace/automotive.jpg';
  if (value.includes('food') || value.includes('grocery') || value.includes('daily')) return '/marketplace/food.jpg';
  return '/marketplace/more.jpg';
};

export function formatCategoryCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`;
  return value.toLocaleString();
}