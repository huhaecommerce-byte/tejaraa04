import type { ProductData } from '@/components/storefront/ProductCard';

export interface HomepageCategory {
  top_category: string;
  cnt: number;
}

export interface HomepageRating {
  product_id: string | null;
  avg_rating: number | null;
  review_count: number | null;
}

export interface HomepageViewCount {
  product_id: string | null;
  total_views: number | null;
}

export type HomepageProduct = ProductData & {
  slug?: string | null;
  top_category?: string;
  created_at?: string;
  is_featured?: boolean;
};