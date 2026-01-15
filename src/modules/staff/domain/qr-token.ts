import { randomBytes } from "crypto";

export function generateQrToken() {
  // 32 bytes -> 64 hex chars
  return randomBytes(32).toString("hex");
}
