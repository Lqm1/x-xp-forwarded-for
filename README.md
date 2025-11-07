# x-xp-forwarded-for

X-XP-Forwarded-For header encryption and decryption library using AES-GCM

[![jsr](https://jsr.io/badges/@lqm1/x-xp-forwarded-for)](https://jsr.io/@lqm1/x-xp-forwarded-for)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [日本語](README_JA.md) | [中文](README_CN.md)

## Overview

This library provides functionality to generate the `x-xp-forwarded-for` header value required for X (formerly Twitter) API requests. This header is necessary when making authenticated requests to X APIs.

### Important Information

- **guestId**: Use the value that exists in X's cookies
- **Xp**: An object containing browser navigator information
- **userAgent**: Modify this according to your environment. Other properties (`hasBeenActive`, `webdriver`) do not need to be changed
- **baseKey**: Use the default value by default. If X changes the key, you can pass it directly to the constructor to update it

## Installation

### Package Managers

#### NPM / PNPM / Yarn

```bash
# NPM
npm i x-xp-forwarded-for

# PNPM
pnpm i x-xp-forwarded-for

# Yarn
yarn add x-xp-forwarded-for
```

#### Deno

```bash
deno add jsr:@lqm1/x-xp-forwarded-for
```

#### Bun

```bash
bun add x-xp-forwarded-for
```

### Import

```ts
// JSR import
import { XpForwarded } from "jsr:@lqm1/x-xp-forwarded-for";

// NPM import
import { XpForwarded } from "x-xp-forwarded-for";
```

## Runtime Compatibility

This library has been tested and confirmed to work with:

- Node.js
- Deno
- Bun
- Cloudflare Workers

## Usage

### Basic Example

```ts
import { XpForwarded } from "x-xp-forwarded-for";
import type { Xp } from "x-xp-forwarded-for/types";

// Create instance with default base key
const xpf = new XpForwarded();

// Prepare data to encrypt
const data: Xp = {
  navigator_properties: {
    hasBeenActive: "true",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    webdriver: "false",
  },
  created_at: Date.now(),
};

// Encrypt
const encrypted = await xpf.generateForwardedFor(data, "guest123");
console.log("Encrypted:", encrypted); // hex string

// Decrypt
const decrypted = await xpf.decodeForwardedFor(encrypted, "guest123");
console.log("Decrypted:", decrypted); // Xp object
```

### Custom Base Key

```ts
import { XpForwarded } from "x-xp-forwarded-for";

// Use custom base key for production
const xpf = new XpForwarded("your-secret-base-key-here");

const data = {
  navigator_properties: {
    hasBeenActive: "true",
    userAgent: "Mozilla/5.0...",
    webdriver: "false",
  },
  created_at: Date.now(),
};

const encrypted = await xpf.generateForwardedFor(data, "user456");
const decrypted = await xpf.decodeForwardedFor(encrypted, "user456");
```

### Using with HTTP Headers

```ts
import { XpForwarded } from "x-xp-forwarded-for";

const xpf = new XpForwarded("your-secret-key");

// Prepare header data
const headerData = {
  navigator_properties: {
    hasBeenActive: "true",
    userAgent: navigator.userAgent,
    webdriver: "false",
  },
  created_at: Date.now(),
};

// Generate encrypted header value
const headerValue = await xpf.generateForwardedFor(headerData, guestId);

// Use in API request
const response = await fetch("https://api.example.com/endpoint", {
  method: "POST",
  headers: {
    "X-XP-Forwarded-For": headerValue,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ /* your data */ }),
});
```

## API Reference

### `XpForwarded`

Main class for encryption and decryption operations.

#### Constructor

```ts
constructor(baseKey?: string)
```

Creates a new XpForwarded instance.

- `baseKey` (optional): The base encryption key. If not provided, uses the default key (for testing only).

#### Methods

##### `generateForwardedFor(data: Xp, guestId: string): Promise<string>`

Encrypts an Xp object and returns a hex-encoded encrypted value.

- `data`: The Xp object to encrypt
- `guestId`: The guest identifier used for key derivation
- Returns: A hex-encoded encrypted string

##### `decodeForwardedFor(hexString: string, guestId: string): Promise<Xp>`

Decrypts a hex-encoded encrypted string back to an Xp object.

- `hexString`: The hex-encoded encrypted string from `generateForwardedFor()`
- `guestId`: The guest identifier used during encryption
- Returns: The decrypted Xp object
- Throws: `Error` if decryption fails (wrong key, wrong guest ID, or corrupted data)

### Types

#### `Xp`

```ts
interface Xp {
  navigator_properties: {
    hasBeenActive: string;
    userAgent: string;
    webdriver: string;
  };
  created_at: number;
}
```

## How It Works

1. **Key Derivation**: Combines the base key with guest ID and generates a SHA-256 hash to create a unique encryption key
2. **Encryption**: Uses AES-GCM with a random 12-byte nonce and 128-bit authentication tag
3. **Output Format**: `nonce (12 bytes) + ciphertext + tag (16 bytes)` encoded as hexadecimal
4. **Security**: Each guest ID produces a unique encryption key, ensuring data isolation between guests

## Testing

```bash
deno test --allow-all
```

## Disclaimer

This library is provided "as is" without warranty of any kind, either express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort or otherwise, arising from, out of, or in connection with the library or the use or other dealings in the library.

This is an unofficial library and is not affiliated with, endorsed, or sponsored by X Corp. (formerly Twitter, Inc.). All X/Twitter-related trademarks and copyrights belong to X Corp. This project is intended for educational and personal use only. Users of this library are responsible for ensuring their usage complies with applicable laws and regulations.

## License

MIT
