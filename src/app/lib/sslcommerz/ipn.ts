import { createHash } from "crypto";
import type { SSLCommerzCallbackPayload } from "./types";

export function verifyIpnSignature(
  payload: SSLCommerzCallbackPayload,
  storePasswd: string,
): boolean {
  if (!payload.verify_sign || !payload.verify_key) return false;

  const keys = payload.verify_key
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  keys.push("store_passwd");
  keys.sort();

  const hashedPass = createHash("md5").update(storePasswd).digest("hex");
  const parts = keys.map((key) => {
    const value = key === "store_passwd" ? hashedPass : (payload[key] ?? "");
    return `${key}=${value}`;
  });

  const computedSign = createHash("md5").update(parts.join("&")).digest("hex");
  return computedSign === payload.verify_sign;
}
