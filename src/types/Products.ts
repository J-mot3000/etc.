export interface Product {
  id: string;
  image: string;
  name: string;
  rating: {
    stars: number;
    count: number;
  };
  priceCents: number;
  price?: number;
  discountPercent?: number;
  salePriceCents?: number;
  inventory?: number;
  category: string;
  subCategory: string;
  keywords: string[];
  description: string;
}
