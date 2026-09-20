import { BASE_URLS, VALIDATION_BY_VAL_ID_URL } from "./config";
import type {
  InitiatePaymentParams,
  InitiatePaymentResponse,
  SSLCommerzEnv,
  ValidationResponse,
} from "./types";

export async function initiatePayment(
  params: InitiatePaymentParams,
  env: SSLCommerzEnv,
): Promise<InitiatePaymentResponse> {
  const url = BASE_URLS[env].payment;
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    body.append(key, String(value));
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok)
    throw new Error(`SSLCommerz initiate failed: HTTP ${res.status}`);
  return res.json() as Promise<InitiatePaymentResponse>;
}

export async function validatePaymentByValId(
  valId: string,
  storeId: string,
  storePasswd: string,
  env: SSLCommerzEnv,
): Promise<ValidationResponse> {
  const url = new URL(VALIDATION_BY_VAL_ID_URL[env]);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", storeId);
  url.searchParams.set("store_passwd", storePasswd);
  url.searchParams.set("v", "1");
  url.searchParams.set("format", "json");
  const res = await fetch(url.toString());
  if (!res.ok)
    throw new Error(`SSLCommerz validation failed: HTTP ${res.status}`);
  return res.json() as Promise<ValidationResponse>;
}
