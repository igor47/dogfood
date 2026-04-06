import { createHmac, timingSafeEqual } from "node:crypto"
import { config } from "@src/config"

const UPLOAD_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function createSignedUploadUrl(baseUrl: string): {
  url: string
  expires_at: string
} {
  const expires = Date.now() + UPLOAD_TTL_MS
  const sig = sign(expires)
  const url = `${baseUrl}/api/uploads/signed?expires=${expires}&sig=${sig}`
  const expires_at = new Date(expires).toISOString()
  return { url, expires_at }
}

export function validateSignedUpload(
  expires: string,
  sig: string
): { valid: true } | { valid: false; error: string } {
  const expiresMs = parseInt(expires, 10)
  if (Number.isNaN(expiresMs)) {
    return { valid: false, error: "Invalid expires parameter" }
  }
  if (Date.now() > expiresMs) {
    return { valid: false, error: "Upload URL has expired" }
  }

  const expected = sign(expiresMs)
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, error: "Invalid signature" }
  }

  return { valid: true }
}

function sign(expires: number): string {
  return createHmac("sha256", config.uploadSigningKey).update(`upload:${expires}`).digest("hex")
}
