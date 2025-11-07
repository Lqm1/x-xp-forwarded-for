# x-xp-forwarded-for

使用 AES-GCM 加密和解密 X-XP-Forwarded-For 头的库

[![jsr](https://jsr.io/badges/@lqm1/x-xp-forwarded-for)](https://jsr.io/@lqm1/x-xp-forwarded-for)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README.md) | [日本語](README_JA.md) | [中文](README_CN.md)

## 概述

这个库提供了生成 X（原 Twitter）API 请求所需的 `x-xp-forwarded-for` 头值的功能。在对 X API 进行经过身份验证的请求时需要此头。

### 重要信息

- **guestId**: 使用 X 的 cookie 中存在的值
- **Xp**: 包含浏览器导航器信息的对象
- **userAgent**: 根据您的环境进行修改。其他属性（`hasBeenActive`、`webdriver`）无需更改
- **baseKey**: 默认使用默认值。如果 X 更改了密钥，可以直接传递给构造函数来更新

## 安装

### 包管理器

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

### 导入

```ts
// JSR 导入
import { XpForwarded } from "jsr:@lqm1/x-xp-forwarded-for";

// NPM 导入
import { XpForwarded } from "x-xp-forwarded-for";
```

## 运行时兼容性

此库已在以下运行时中测试通过:

- Node.js
- Deno
- Bun
- Cloudflare Workers

## 使用方法

### 基本示例

```ts
import { XpForwarded } from "x-xp-forwarded-for";
import type { Xp } from "x-xp-forwarded-for/types";

// 使用默认基础密钥创建实例
const xpf = new XpForwarded();

// 准备要加密的数据
const data: Xp = {
  navigator_properties: {
    hasBeenActive: "true",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    webdriver: "false",
  },
  created_at: Date.now(),
};

// 加密
const encrypted = await xpf.generateForwardedFor(data, "guest123");
console.log("加密:", encrypted); // 十六进制字符串

// 解密
const decrypted = await xpf.decodeForwardedFor(encrypted, "guest123");
console.log("解密:", decrypted); // Xp 对象
```

### 自定义基础密钥

```ts
import { XpForwarded } from "x-xp-forwarded-for";

// 在生产环境中使用自定义基础密钥
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

### 在 HTTP 头中使用

```ts
import { XpForwarded } from "x-xp-forwarded-for";

const xpf = new XpForwarded("your-secret-key");

// 准备头数据
const headerData = {
  navigator_properties: {
    hasBeenActive: "true",
    userAgent: navigator.userAgent,
    webdriver: "false",
  },
  created_at: Date.now(),
};

// 生成加密的头值
const headerValue = await xpf.generateForwardedFor(headerData, guestId);

// 在 API 请求中使用
const response = await fetch("https://api.example.com/endpoint", {
  method: "POST",
  headers: {
    "X-XP-Forwarded-For": headerValue,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ /* your data */ }),
});
```

## API 参考

### `XpForwarded`

用于加密和解密操作的主类。

#### 构造函数

```ts
constructor(baseKey?: string)
```

创建一个新的 XpForwarded 实例。

- `baseKey` (可选): 基础加密密钥。如果未提供,则使用默认密钥(仅用于测试)。

#### 方法

##### `generateForwardedFor(data: Xp, guestId: string): Promise<string>`

加密 Xp 对象并返回十六进制编码的加密值。

- `data`: 要加密的 Xp 对象
- `guestId`: 用于密钥派生的访客标识符
- 返回值: 十六进制编码的加密字符串

##### `decodeForwardedFor(hexString: string, guestId: string): Promise<Xp>`

将十六进制编码的加密字符串解密回 Xp 对象。

- `hexString`: 从 `generateForwardedFor()` 获得的十六进制编码的加密字符串
- `guestId`: 加密时使用的访客标识符
- 返回值: 解密后的 Xp 对象
- 异常: 如果解密失败(密钥错误、访客 ID 错误或数据损坏),抛出 `Error`

### 类型

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

## 工作原理

1. **密钥派生**: 将基础密钥与访客 ID 组合,生成 SHA-256 哈希以创建唯一的加密密钥
2. **加密**: 使用带有随机 12 字节 nonce 和 128 位认证标签的 AES-GCM 加密
3. **输出格式**: `nonce(12 字节) + 密文 + 标签(16 字节)` 编码为十六进制
4. **安全性**: 每个访客 ID 生成唯一的加密密钥,确保访客之间的数据隔离

## 测试

```bash
deno test --allow-all
```

## 免责声明

本库按"原样"提供,不提供任何明示或暗示的保证,包括但不限于适销性、特定用途适用性和非侵权性的保证。在任何情况下,作者或版权持有人均不对任何索赔、损害或其他责任负责,无论是在合同诉讼、侵权行为还是其他方面,由库或库的使用或其他交易引起、由此产生或与之相关。

这是一个非官方库,未经 X Corp.(原 Twitter, Inc.)的认可、支持或赞助。所有 X/Twitter 相关商标和版权归 X Corp. 所有。本项目仅用于教育和个人使用。本库的用户有责任确保其使用符合适用的法律法规。

## 许可证

MIT
