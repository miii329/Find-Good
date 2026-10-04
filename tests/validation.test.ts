import { test } from "node:test";
import assert from "node:assert/strict";
import {
  profileInput,
  favoriteInput,
  isSupportedImage,
  isSameOrigin,
} from "../lib/validation";
const sample = {
  name: "山田 はな",
  category: "UI / UX",
  location: "東京",
  skill: "情報設計",
  bio: "自己紹介",
  tools: "Figma",
  budget: "",
  title: "作品",
  image: "",
  url: "https://example.com",
  available: true,
};
test("valid profile trims name and strips injected ownership", () => {
  const parsed = profileInput.parse({
    ...sample,
    name: " はな ",
    owner: "attacker",
    id: "other",
  });
  assert.equal(parsed.name, "はな");
  assert.equal("owner" in parsed, false);
  assert.equal("id" in parsed, false);
});
test("reject unsafe URLs, blank names and unknown categories", () => {
  for (const patch of [
    { url: "javascript:alert(1)" },
    { image: "data:image/svg+xml;base64,aaa" },
    { name: " " },
    { category: "unknown" },
  ])
    assert.equal(
      profileInput.safeParse({ ...sample, ...patch }).success,
      false,
    );
});
test("favorite requires a boolean", () => {
  assert.equal(
    favoriteInput.safeParse({ id: "demo-01", saved: "false" }).success,
    false,
  );
});
test("image signatures reject SVG and arbitrary text", () => {
  assert.equal(isSupportedImage(Buffer.from("<svg></svg>")), false);
  assert.equal(isSupportedImage(new Uint8Array([255, 216, 255, 224])), true);
  assert.equal(isSupportedImage(Buffer.from("RIFF0000WEBP")), true);
});
test("writes require exact same origin", () => {
  assert.equal(
    isSameOrigin(
      new Request("http://localhost:3000/api/uploads", {
        headers: { origin: "https://evil.test" },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOrigin(
      new Request("http://localhost:3000/api/uploads", {
        headers: { origin: "http://localhost:3000" },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOrigin(new Request("http://localhost:3000/api/uploads")),
    false,
  );
});
test("Next.js reconstructed hostname respects the browser Host header", () => {
  const previous = process.env.AUTH_URL;
  delete process.env.AUTH_URL;
  try {
    assert.equal(
      isSameOrigin(
        new Request("http://localhost:3100/api/uploads", {
          headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" },
        }),
      ),
      true,
    );
    process.env.AUTH_URL = "https://example.com";
    assert.equal(
      isSameOrigin(
        new Request("http://internal:3000/api/uploads", {
          headers: { host: "internal:3000", origin: "https://example.com" },
        }),
      ),
      true,
    );
    assert.equal(
      isSameOrigin(
        new Request("http://internal:3000/api/uploads", {
          headers: { host: "internal:3000", origin: "https://evil.test" },
        }),
      ),
      false,
    );
  } finally {
    if (previous === undefined) delete process.env.AUTH_URL;
    else process.env.AUTH_URL = previous;
  }
});
