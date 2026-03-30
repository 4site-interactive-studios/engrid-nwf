export type CwhCartData = {
  email: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  region?: string;
  zip?: string;
  country?: string;
  totalAmount: number;
  returnUrl: string;
  successUrl: string;
  transactionId: number | string;
  externalRef?: string;
};
