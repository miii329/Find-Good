import { auth, isAuthConfigured } from "@/auth";
import { getDb } from "@/db";
import { profiles, favorites } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { demoDesigners, type Designer } from "@/app/data";
import { z } from "zod";
import { profileInput, favoriteInput, isSameOrigin } from "@/lib/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function publicProfile(p: typeof profiles.$inferSelect): Designer {
  return {
    id: p.id,
    name: p.name,
    english: p.english,
    category: p.category,
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
export async function GET() {
  try {
    const configured = isAuthConfigured();
    const session = configured ? await auth() : null;
    if (!process.env.DATABASE_URL)
      return Response.json(
        {
          profiles: [],
          favorites: [],
          mine: null,
          signedIn: false,
          setupRequired: true,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    const db = getDb();
    const rows = await db
      .select()
      .from(profiles)
      .orderBy(asc(profiles.createdAt));
    const saved = session?.user.id
      ? await db
          .select()
          .from(favorites)
          .where(eq(favorites.owner, session.user.id))
      : [];
    const mine = rows.find((p) => p.owner === session?.user.id);
    return Response.json(
      {
        profiles: rows.map(publicProfile),
        favorites: saved.map((f) => f.designer),
        mine: mine ? publicProfile(mine) : null,
        signedIn: !!session?.user.id,
        setupRequired: !configured,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Directory read failed", error);
    return Response.json(
      {
        error:
          "データを読み込めませんでした。DB接続とマイグレーションを確認してください。",
      },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "不正なリクエストです。" }, { status: 403 });
  if (!isAuthConfigured())
    return Response.json(
      { error: "認証の環境変数を設定してください。" },
      { status: 503 },
    );
  try {
    const session = await auth();
    if (!session?.user.id)
      return Response.json({ error: "ログインが必要です。" }, { status: 401 });
    const owner = session.user.id;
    const db = getDb();
    const body = z
      .object({ action: z.enum(["profile", "favorite", "remove"]) })
      .passthrough()
      .parse(await request.json());
    if (body.action === "profile") {
      const input = profileInput.parse(body);
      const values = {
        ...input,
        budget: input.budget || "応相談",
        updatedAt: new Date(),
      };
      const [saved] = await db
        .insert(profiles)
        .values({ ...values, owner })
        .onConflictDoUpdate({ target: profiles.owner, set: values })
        .returning();
      return Response.json(publicProfile(saved));
    }
    if (body.action === "remove") {
      const [existing] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.owner, owner));
      if (existing)
        await db.batch([
          db.delete(favorites).where(eq(favorites.designer, existing.id)),
          db.delete(profiles).where(eq(profiles.owner, owner)),
        ]);
      return Response.json({ ok: true });
    }
    const { id, saved } = favoriteInput.parse(body);
    const exists =
      demoDesigners.some((p) => p.id === id) ||
      (
        await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.id, id))
          .limit(1)
      ).length > 0;
    if (!exists)
      return Response.json(
        { error: "デザイナーが見つかりません。" },
        { status: 404 },
      );
    if (saved)
      await db
        .insert(favorites)
        .values({ owner, designer: id })
        .onConflictDoNothing();
    else
      await db
        .delete(favorites)
        .where(and(eq(favorites.owner, owner), eq(favorites.designer, id)));
    return Response.json(
      (await db.select().from(favorites).where(eq(favorites.owner, owner))).map(
        (f) => f.designer,
      ),
    );
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return Response.json(
        {
          error:
            "入力内容をご確認ください。URLはhttpまたはhttpsで入力してください。",
        },
        { status: 400 },
      );
    console.error("Directory write failed", error);
    return Response.json(
      { error: "保存に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }
}
