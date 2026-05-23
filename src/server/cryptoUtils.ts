import crypto from "crypto";

const ENCRYPTION_KEY_RAW = process.env.AI_CREDENTIAL_ENCRYPTION_KEY || "fallback_secret_for_key_generation_32_bytes";

// Guarantee a 32-byte key buffer using SHA-256 of whatever raw key is provided
function getKeyBuffer(): Buffer {
  return crypto.createHash("sha256").update(ENCRYPTION_KEY_RAW).digest();
}

export function encryptText(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = getKeyBuffer();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptText(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const key = getKeyBuffer();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
