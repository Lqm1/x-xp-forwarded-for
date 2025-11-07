import { assertEquals, assertNotEquals, assertRejects } from "@std/assert";
import { XpForwarded } from "./mod.ts";
import type { Xp } from "./types.ts";

Deno.test("XpForwarded - should encrypt and decrypt Xp object correctly", async () => {
  const xpf = new XpForwarded();
  const guestId = "test-guest-id-123";
  
  const testData: Xp = {
    navigator_properties: {
      hasBeenActive: "true",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      webdriver: "false"
    },
    created_at: 1699372800000 // Fixed timestamp: 2023-11-07T16:00:00.000Z
  };
  
  const encrypted = await xpf.generateForwardedFor(testData, guestId);
  const decrypted = await xpf.decodeForwardedFor(encrypted, guestId);
  
  assertEquals(decrypted.navigator_properties.hasBeenActive, testData.navigator_properties.hasBeenActive);
  assertEquals(decrypted.navigator_properties.userAgent, testData.navigator_properties.userAgent);
  assertEquals(decrypted.navigator_properties.webdriver, testData.navigator_properties.webdriver);
  assertEquals(decrypted.created_at, testData.created_at);
});

Deno.test("XpForwarded - should produce different encrypted values for different guest IDs", async () => {
  const xpf = new XpForwarded();
  
  const testData: Xp = {
    navigator_properties: {
      hasBeenActive: "true",
      userAgent: "Mozilla/5.0",
      webdriver: "false"
    },
    created_at: 1234567890000
  };
  
  const encrypted1 = await xpf.generateForwardedFor(testData, "guest1");
  const encrypted2 = await xpf.generateForwardedFor(testData, "guest2");
  
  assertNotEquals(encrypted1, encrypted2);
  
  const decrypted1 = await xpf.decodeForwardedFor(encrypted1, "guest1");
  const decrypted2 = await xpf.decodeForwardedFor(encrypted2, "guest2");
  
  assertEquals(decrypted1.created_at, testData.created_at);
  assertEquals(decrypted2.created_at, testData.created_at);
});

Deno.test("XpForwarded - should fail to decrypt with wrong guest ID", async () => {
  const xpf = new XpForwarded();
  
  const testData: Xp = {
    navigator_properties: {
      hasBeenActive: "true",
      userAgent: "Mozilla/5.0",
      webdriver: "false"
    },
    created_at: 1234567890000
  };
  
  const encrypted = await xpf.generateForwardedFor(testData, "correct-guest-id");
  
  await assertRejects(
    async () => {
      await xpf.decodeForwardedFor(encrypted, "wrong-guest-id");
    },
    Error
  );
});

Deno.test("XpForwarded - should produce different encrypted values for same data (due to random IV)", async () => {
  const xpf = new XpForwarded();
  const guestId = "test-guest-id";
  
  const testData: Xp = {
    navigator_properties: {
      hasBeenActive: "true",
      userAgent: "Mozilla/5.0",
      webdriver: "false"
    },
    created_at: 1234567890000
  };
  
  const encrypted1 = await xpf.generateForwardedFor(testData, guestId);
  const encrypted2 = await xpf.generateForwardedFor(testData, guestId);
  
  // Due to random IV, even the same data should produce different encrypted values
  assertNotEquals(encrypted1, encrypted2);
  
  // But both should decrypt to the same value
  const decrypted1 = await xpf.decodeForwardedFor(encrypted1, guestId);
  const decrypted2 = await xpf.decodeForwardedFor(encrypted2, guestId);
  
  assertEquals(decrypted1.created_at, decrypted2.created_at);
  assertEquals(decrypted1.navigator_properties, decrypted2.navigator_properties);
});

Deno.test("XpForwarded - should work with custom base key", async () => {
  const customKey = "custom-secret-key-for-testing";
  const xpf = new XpForwarded(customKey);
  const guestId = "test-guest-id";
  
  const testData: Xp = {
    navigator_properties: {
      hasBeenActive: "false",
      userAgent: "Custom User Agent",
      webdriver: "true"
    },
    created_at: 9876543210000
  };
  
  const encrypted = await xpf.generateForwardedFor(testData, guestId);
  const decrypted = await xpf.decodeForwardedFor(encrypted, guestId);
  
  assertEquals(decrypted.navigator_properties, testData.navigator_properties);
  assertEquals(decrypted.created_at, testData.created_at);
});

Deno.test("XpForwarded - should fail to decrypt with different base key", async () => {
  const xpf1 = new XpForwarded("base-key-1");
  const xpf2 = new XpForwarded("base-key-2");
  const guestId = "test-guest-id";
  
  const testData: Xp = {
    navigator_properties: {
      hasBeenActive: "true",
      userAgent: "Mozilla/5.0",
      webdriver: "false"
    },
    created_at: 1234567890000
  };
  
  const encrypted = await xpf1.generateForwardedFor(testData, guestId);
  
  await assertRejects(
    async () => {
      await xpf2.decodeForwardedFor(encrypted, guestId);
    },
    Error
  );
});

