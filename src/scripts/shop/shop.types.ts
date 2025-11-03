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

export type ShippingAddress = {
  country: string;
  zip: string;
  state: string;
  city: string;
  street: string;
}

export type TransactionSessionData = {
  product: ProductVariant | null;
  address: ShippingAddress;
  amountWithoutTax: number;
  shipping: number;
  tax: number;
  discount: number;
}

export interface Order {
  from_country?: string;
  from_zip?: string;
  from_state?: string;
  from_city?: string;
  from_street?: string;
  to_country: string;
  to_zip?: string;
  to_state?: string;
  to_city?: string;
  to_street?: string;
  amount?: number; // if not using line items
  shipping: number;
  line_items?: OrderLineItem[];
}

export interface OrderLineItem {
  id?: string;
  quantity?: number;
  product_tax_code?: string;
  unit_price?: number;
  discount?: number;
}

export interface Transaction {
  transaction_id: string;
  transaction_date: string;
  supporter_id: number; // EN supporter ID
  from_country?: string;
  from_zip?: string;
  from_state?: string;
  from_city?: string;
  from_street?: string;
  to_country: string;
  to_zip: string;
  to_state: string;
  to_city: string;
  to_street: string;
  amount: number; // total amount of line items including shipping but excluding tax
  shipping: number;
  sales_tax: number;
  line_items: TransactionLineItem[];
}

export interface TransactionLineItem extends OrderLineItem {
  product_identifier?: string;
  description?: string;
  sales_tax?: number;
}

export type RemoveProductVariants = {
  product: string,
  variantName: string,
  variantOptions: string[]
}

