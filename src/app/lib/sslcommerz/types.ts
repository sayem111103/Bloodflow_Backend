import type { SSLCommerzEnv } from "./config";
export type { SSLCommerzEnv };

export type InitiatePaymentParams = {
  store_id: string;
  store_passwd: string;
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  product_name: string;
  product_category: string;
  product_profile: string;
  shipping_method: string;
  cus_name: string;
  cus_email: string;
  cus_add1: string;
  cus_city: string;
  cus_state: string;
  cus_postcode: string;
  cus_country: string;
  cus_phone: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
};

export type InitiatePaymentResponse = {
  status: "SUCCESS" | "FAILED";
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  storeLogo?: string;
};

export type ValidationResponse = {
  status: "VALID" | "VALIDATED" | "INVALID_TRANSACTION" | "FAILED" | string;
  tran_date?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  store_amount?: string;
  currency?: string;
  bank_tran_id?: string;
  card_type?: string;
  card_no?: string;
  currency_type?: string;
  currency_amount?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
  risk_level?: string;
  risk_title?: string;
};

export type SSLCommerzCallbackPayload = {
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency?: string;
  status?: string;
  bank_tran_id?: string;
  card_type?: string;
  verify_key?: string;
  verify_sign?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
  [key: string]: string | undefined;
};
