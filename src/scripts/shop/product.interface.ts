export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  variants: Array<ProductVariant>;
}

export type ProductVariant = {
  id: number;
  productId: number;
  price: number;
  image: string;
  name: string;
  quantity: number;
}
