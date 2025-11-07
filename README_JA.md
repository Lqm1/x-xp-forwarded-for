# x-xp-forwarded-for

AES-GCM を使用した X-XP-Forwarded-For ヘッダーの暗号化・復号化ライブラリ

[![jsr](https://jsr.io/badges/@lqm1/x-xp-forwarded-for)](https://jsr.io/@lqm1/x-xp-forwarded-for)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [日本語](README_JA.md) | [中文](README_CN.md)

## 概要

このライブラリは、X（旧Twitter）のAPIリクエストで必要となる`x-xp-forwarded-for`ヘッダーの値を生成するための機能を提供します。このヘッダーは、X APIに対する認証済みリクエストを行う際に必要となります。

### 重要な情報

- **guestId**: Xのクッキーに存在する値を使用します
- **Xp**: ブラウザのナビゲーター情報を含むオブジェクトです
- **userAgent**: 各自の環境に合わせて変更してください。その他のプロパティ(`hasBeenActive`, `webdriver`)は変更不要です
- **baseKey**: 基本的にはデフォルト値を使用します。Xがキーを変更した場合は、コンストラクタに直接渡すことで変更可能です

## インストール

### パッケージマネージャー

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

### インポート

```ts
// JSR インポート
import { XpForwarded } from "jsr:@lqm1/x-xp-forwarded-for";

// NPM インポート
import { XpForwarded } from "x-xp-forwarded-for";
```

## ランタイム互換性

このライブラリは以下のランタイムでテスト済みです:

- Node.js
- Deno
- Bun
- Cloudflare Workers

## 使い方

### 基本的な例

```ts
import { XpForwarded } from "x-xp-forwarded-for";
import type { Xp } from "x-xp-forwarded-for/types";

// デフォルトのベースキーでインスタンスを作成
const xpf = new XpForwarded();

// 暗号化するデータを準備
const data: Xp = {
  navigator_properties: {
    hasBeenActive: "true",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    webdriver: "false",
  },
  created_at: Date.now(),
};

// 暗号化
const encrypted = await xpf.generateForwardedFor(data, "guest123");
console.log("暗号化:", encrypted); // hex 文字列

// 復号化
const decrypted = await xpf.decodeForwardedFor(encrypted, "guest123");
console.log("復号化:", decrypted); // Xp オブジェクト
```

### カスタムベースキー

```ts
import { XpForwarded } from "x-xp-forwarded-for";

// 本番環境ではカスタムベースキーを使用
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

### HTTP ヘッダーでの使用

```ts
import { XpForwarded } from "x-xp-forwarded-for";

const xpf = new XpForwarded("your-secret-key");

// ヘッダーデータを準備
const headerData = {
  navigator_properties: {
    hasBeenActive: "true",
    userAgent: navigator.userAgent,
    webdriver: "false",
  },
  created_at: Date.now(),
};

// 暗号化されたヘッダー値を生成
const headerValue = await xpf.generateForwardedFor(headerData, guestId);

// API リクエストで使用
const response = await fetch("https://api.example.com/endpoint", {
  method: "POST",
  headers: {
    "X-XP-Forwarded-For": headerValue,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ /* your data */ }),
});
```

## API リファレンス

### `XpForwarded`

暗号化と復号化操作のためのメインクラス。

#### コンストラクタ

```ts
constructor(baseKey?: string)
```

新しい XpForwarded インスタンスを作成します。

- `baseKey` (オプション): ベース暗号化キー。指定しない場合、デフォルトキー(テスト用のみ)を使用します。

#### メソッド

##### `generateForwardedFor(data: Xp, guestId: string): Promise<string>`

Xp オブジェクトを暗号化し、16進数エンコードされた暗号化値を返します。

- `data`: 暗号化する Xp オブジェクト
- `guestId`: 鍵導出に使用されるゲスト識別子
- 戻り値: 16進数エンコードされた暗号化文字列

##### `decodeForwardedFor(hexString: string, guestId: string): Promise<Xp>`

16進数エンコードされた暗号化文字列を Xp オブジェクトに復号化します。

- `hexString`: `generateForwardedFor()` から取得した16進数エンコードされた暗号化文字列
- `guestId`: 暗号化時に使用したゲスト識別子
- 戻り値: 復号化された Xp オブジェクト
- 例外: 復号化に失敗した場合(キーの不一致、ゲスト ID の不一致、またはデータの破損)、`Error` をスロー

### 型

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

## 仕組み

1. **鍵導出**: ベースキーとゲスト ID を組み合わせ、SHA-256 ハッシュを生成して一意の暗号化キーを作成
2. **暗号化**: ランダムな12バイトのノンスと128ビット認証タグを使用した AES-GCM で暗号化
3. **出力フォーマット**: `ノンス(12バイト) + 暗号文 + タグ(16バイト)` を16進数エンコード
4. **セキュリティ**: 各ゲスト ID が一意の暗号化キーを生成し、ゲスト間のデータ分離を保証

## テスト

```bash
deno test --allow-all
```

## 免責事項

このライブラリは「現状のまま」提供され、商品性、特定目的への適合性、非侵害性の保証を含む、明示的または黙示的ないかなる種類の保証もありません。いかなる場合においても、著作者または著作権者は、契約、不法行為、またはその他の理由により、ライブラリまたはライブラリの使用またはその他の取引から生じる、いかなる請求、損害、またはその他の責任についても責任を負いません。

これは非公式のライブラリであり、X Corp.(旧 Twitter, Inc.)によって承認、支援、またはスポンサーされているものではありません。X/Twitter 関連のすべての商標および著作権は X Corp. に帰属します。このプロジェクトは教育および個人使用のみを目的としています。このライブラリの利用者は、その使用が適用される法律および規制に準拠していることを確認する責任があります。

## ライセンス

MIT
