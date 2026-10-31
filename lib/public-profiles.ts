import "server-only";
import { unstable_cache } from "next/cache";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { parseCategories } from "@/lib/categories";
import { isAdminId } from "@/lib/contact";
import type { Designer } from "@/app/data";

/** 公開プロフィール一覧のキャッシュに付けるタグ。保存・削除時にこのタグを無効化する。 */
export const PUBLIC_PROFILES_TAG = "public-profiles";

export function publicProfile(p: typeof profiles.$inferSelect): Designer {
  return {
    id: p.id,
    isOwner: isAdminId(p.owner, process.env.ADMIN_USER_IDS),
    name: p.name,
    english: p.english,
    categories: parseCategories(p.category),
    location: p.location,
    bio: p.bio,
    skill: p.skill,
    tools: p.tools,
    available: p.available,
    image: p.image,
    title: p.title,
    budget: p.budget,
    url: p.url,
  };
}

/**
 * 誰が見ても同じ公開プロフィール一覧。
 * 訪問のたびにNeonを起こさないよう、Next.jsのキャッシュに載せる。
 * 作り直すのは、保存・削除でタグが無効化されたときと、保険の1日が過ぎたときだけ。
 * DB接続に失敗したときは例外をそのまま投げ、キャッシュ済みの古い一覧を使い続けさせる。
 */
export const getPublicProfiles = unstable_cache(
  async (): Promise<Designer[]> => {
    if (!process.env.DATABASE_URL) return [];
    const rows = await getDb()
      .select()
      .from(profiles)
      .orderBy(asc(profiles.createdAt));
    return rows.map(publicProfile);
  },
  // Designer の形を変えたら版を上げる。古い形のキャッシュを読まないようにするため。
  ["public-profiles", "v2"],
  { tags: [PUBLIC_PROFILES_TAG], revalidate: 86400 },
);
