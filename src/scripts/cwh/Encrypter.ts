export default class Encrypter {
  private readonly key: string;
  private encryptionKey: CryptoKey | null = null;

  constructor(key: string) {
    this.key = key;
  }

  async importKey(key: string) {
    const raw = Uint8Array.from(atob(key), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
      "encrypt",
      "decrypt",
    ]);
  }

  // Encrypts an object into a "URL-safe" Base64-encoded string
  async encryptJson(object: Object): Promise<string> {
    if (!this.encryptionKey) {
      this.encryptionKey = await this.importKey(this.key);
    }

    const plaintext = new TextEncoder().encode(JSON.stringify(object));

    // Generate a random 12-byte nonce (IV)
    const nonce = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt using AES-GCM
    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      this.encryptionKey,
      plaintext
    );

    // ciphertextBuffer includes the tag at the end automatically
    const ciphertext = new Uint8Array(ciphertextBuffer);

    // Combine nonce + ciphertext
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce, 0);
    combined.set(ciphertext, nonce.length);

    // Base64-url encode
    let b64 = btoa(String.fromCharCode(...combined));
    b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    return b64;
  }

  // Decrypts "URL-safe" Base64-encoded string back into an object
  async decryptData(data: String): Promise<Object> {
    if (!this.encryptionKey) {
      this.encryptionKey = await this.importKey(this.key);
    }

    // Convert URL-safe Base64 → regular Base64
    const b64 =
      data.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((data.length + 3) % 4);

    const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const nonce = combined.slice(0, 12);
    const tag = combined.slice(combined.length - 16);
    const ciphertext = combined.slice(12, combined.length - 16);

    const ctAndTag = new Uint8Array(ciphertext.length + tag.length);
    ctAndTag.set(ciphertext);
    ctAndTag.set(tag, ciphertext.length);

    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce },
      this.encryptionKey,
      ctAndTag
    );

    return JSON.parse(new TextDecoder().decode(plaintext));
  }
}
