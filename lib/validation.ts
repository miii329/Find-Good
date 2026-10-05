import { z } from "zod";
export const httpUrl = z
  .string()
  .max(2000)
  .url()
  .refine(
    (s) => /^https?:\/\//i.test(s),
    "httpまたはhttpsのURLを入力してください",
  );
export const profileInput = z.object({
  name: z.string().trim().min(1).max(40),
  category: z.enum([
    "ブランディング",
    "Webデザイン",
    "UI / UX",
    "グラフィック",
    "イラスト",
  ]),
  location: z.string().trim().min(1).max(40),
  skill: z.string().trim().min(1).max(80),
  bio: z.string().trim().min(1).max(1000),
  tools: z.string().max(100),
  budget: z.string().max(40),
  title: z.string().trim().min(1).max(100),
  image: z.union([httpUrl, z.literal("")]),
  url: httpUrl,
  available: z.boolean(),
});
export const favoriteInput = z.object({
  id: z.string().min(1).max(100),
  saved: z.boolean(),
});
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export function isSupportedImage(bytes: Uint8Array) {
  return (
    (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a) ||
    (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP")
  );
}
export function isSameOrigin(request: Request) {
  const url = new URL(request.url);
  // Next.js can reconstruct request.url with localhost even when the browser uses 127.0.0.1.
  // AUTH_URL is the canonical origin behind production proxies.
  const expected = process.env.AUTH_URL
    ? new URL(process.env.AUTH_URL).origin
    : `${url.protocol}//${request.headers.get("host") ?? url.host}`;
  return request.headers.get("origin") === expected;
}
