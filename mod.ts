/**
 * X-XP-Forwarded-For header encryption and decryption module.
 *
 * This module provides AES-GCM encryption for IP addresses and other forwarded-for headers,
 * with guest-specific key derivation for enhanced security.
 *
 * @example
 * ```ts
 * import { XpForwarded } from "@lqm1/x-xp-forwarded-for";
 * import type { Xp } from "./types.ts";
 *
 * // Create instance with default base key
 * const xpf = new XpForwarded();
 *
 * // Or with custom base key
 * const xpfCustom = new XpForwarded("your-secret-base-key");
 *
 * // Encrypt Xp object
 * const data: Xp = {
 *   navigator_properties: {
 *     hasBeenActive: "true",
 *     userAgent: "Mozilla/5.0...",
 *     webdriver: "false"
 *   },
 *   created_at: Date.now()
 * };
 * const encrypted = await xpf.generateForwardedFor(data, "guest123");
 * console.log(encrypted); // hex string
 *
 * // Decrypt
 * const decrypted = await xpf.decodeForwardedFor(encrypted, "guest123");
 * console.log(decrypted); // Xp object
 * ```
 *
 * @module
 */

import type { Xp } from "./types.ts";

/**
 * Encrypts and decrypts X-XP-Forwarded-For header values using AES-GCM.
 *
 * Each guest ID generates a unique encryption key derived from the base key,
 * ensuring that encrypted values can only be decrypted with the correct
 * base key and guest ID combination.
 */
export class XpForwarded {
  private baseKey: string;
  private static readonly DEFAULT_BASE_KEY =
    "0e6be1f1e21ffc33590b888fd4dc81b19713e570e805d4e5df80a493c9571a05";

  /**
   * Creates a new XpForwarded instance.
   *
   * @param baseKey - The base encryption key. If not provided, uses the default key.
   */
  constructor(baseKey?: string) {
    this.baseKey = baseKey ?? XpForwarded.DEFAULT_BASE_KEY;
  }

  /**
   * Derives an AES-GCM encryption key from the base key and guest ID.
   *
   * @param guestId - The guest identifier to derive the key for
   * @returns A promise that resolves to a CryptoKey for AES-GCM operations
   */
  private async deriveEncryptionKey(guestId: string): Promise<CryptoKey> {
    const combined = this.baseKey + guestId;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return await crypto.subtle.importKey(
      "raw",
      hashBuffer,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypts a Xp object and returns a hex-encoded encrypted value.
   *
   * The returned string contains: nonce (12 bytes) + ciphertext + authentication tag (16 bytes),
   * all encoded as a hexadecimal string.
   *
   * @param data - The Xp object to encrypt
   * @param guestId - The guest identifier used for key derivation
   * @returns A promise that resolves to a hex-encoded encrypted string
   *
   * @example
   * ```ts
   * const xpf = new XpForwarded();
   * const data: Xp = {
   *   navigator_properties: {
   *     hasBeenActive: "true",
   *     userAgent: "Mozilla/5.0...",
   *     webdriver: "false"
   *   },
   *   created_at: Date.now()
   * };
   * const encrypted = await xpf.generateForwardedFor(data, "guest123");
   * ```
   */
  async generateForwardedFor(data: Xp, guestId: string): Promise<string> {
    const key = await this.deriveEncryptionKey(guestId);

    const nonce = crypto.getRandomValues(new Uint8Array(12));

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(JSON.stringify(data));

    const cipherText = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: nonce,
        tagLength: 128,
      },
      key,
      dataBytes
    );

    const combined = new Uint8Array(nonce.length + cipherText.byteLength);
    combined.set(nonce, 0);
    combined.set(new Uint8Array(cipherText), nonce.length);

    return Array.from(combined)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Decrypts a hex-encoded encrypted string back to a Xp object.
   *
   * @param hexString - The hex-encoded encrypted string from generateForwardedFor()
   * @param guestId - The guest identifier used during encryption
   * @returns A promise that resolves to the decrypted Xp object
   * @throws {Error} If decryption fails (wrong key, wrong guest ID, or corrupted data)
   *
   * @example
   * ```ts
   * const xpf = new XpForwarded();
   * const decrypted = await xpf.decodeForwardedFor(encryptedHex, "guest123");
   * ```
   */
  async decodeForwardedFor(hexString: string, guestId: string): Promise<Xp> {
    const key = await this.deriveEncryptionKey(guestId);

    const raw = Uint8Array.from(hexString.match(/.{1,2}/g) ?? [], b => parseInt(b, 16));

    const nonce = raw.slice(0, 12);
    const cipherText = raw.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: nonce,
        tagLength: 128,
      },
      key,
      cipherText
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decrypted);
    return JSON.parse(jsonString) as Xp;
  }
}

export default XpForwarded;
