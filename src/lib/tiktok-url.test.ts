import { describe, it, expect } from "vitest";
import { parseTikTokUrl, isShortLink } from "./tiktok-url";

describe("parseTikTokUrl", () => {
  it("normalizes a valid URL and drops tracking params", () => {
    expect(parseTikTokUrl("https://www.tiktok.com/@user.name/video/7234567890123456789?lang=en")?.canonicalUrl)
      .toBe("https://www.tiktok.com/@user.name/video/7234567890123456789");
  });
  it.each([
    "http://www.tiktok.com/@a/video/1234567",
    "https://evil.com/@a/video/1234567",
    "https://www.tiktok.com.evil.com/@a/video/1234567",
    "https://localhost/@a/video/1234567",
    "https://127.0.0.1/@a/video/1234567",
    "https://user:pw@www.tiktok.com/@a/video/1234567",
    "https://www.tiktok.com:8443/@a/video/1234567",
    "https://www.tiktok.com/@a/photo/1234567",
    "not a url",
  ])("rejects %s", (u) => expect(parseTikTokUrl(u)).toBeNull());
  it("detects short links only on allowlisted hosts", () => {
    expect(isShortLink("https://vm.tiktok.com/ZMabc/")).toBe(true);
    expect(isShortLink("https://vm.tiktok.com.evil.com/x")).toBe(false);
  });
});
