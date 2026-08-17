import { randomBytes, randomUUID } from "node:crypto"

export const newId = () => randomUUID()

/** Temp passwords the admin reads out once. Ambiguous glyphs are excluded. */
export function generatePassword(length = 12) {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(length)
  let out = ""
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length]
  // Guarantee the result clears any "needs a digit" policy.
  return out.slice(0, -1) + String(bytes[0] % 10)
}
