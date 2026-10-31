import { getRegistration } from "@/lib/registration-store";
import { hasRole } from "@/lib/registration";
import { auth, isAuthConfigured } from "@/auth";
import { getDb } from "@/db";
import { profiles, favorites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { demoDesigners } from "@/app/data";
import { z } from "zod";
import { profileInput, favoriteInput, isSameOrigin } from "@/lib/validation";
import { isAdminId } from "@/lib/contact";
import { CATEGORY_SEPARATOR } from "@/lib/categories";
import { publicProfile, PUBLIC_PROFILES_TAG } from "@/lib/public-profiles";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const configured = isAuthConfigured();
    const session = configured ? await auth() : null;
    if (!process.env.DATABASE_URL)
      return Response.json(
        {
          favorites: [],
          mine: null,
          signedIn: false,
          isAdmin: false,
          setupRequired: true,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    const db = getDb();
    const registration = session?.user.id
      ? await getRegistration(session.user.id)
      : undefined;
    // 公開一覧はトップページのキャッシュから配る。ここではログイン中の本人の情報だけを返す。
    const [mine] = session?.user.id
      ? await db
          .select()
          .from(profiles)
          .where(eq(profiles.owner, session.user.id))
          .limit(1)
      : [];
    const saved = session?.user.id
      ? await db
          .select()
          .from(favorites)
          .where(eq(favorites.owner, session.user.id))
      : [];
    return Response.json(
      {
        favorites: saved.map((f) => f.designer),
        mine: mine ? publicProfile(mine) : null,
        signedIn: !!session?.user.id,
        isAdmin: isAdminId(session?.user.id, process.env.ADMIN_USER_IDS),
        accountRole: registration?.role ?? null,
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
      const registration = await getRegistration(owner);
      if (!hasRole(registration?.role, "creator"))
        return Response.json(
          { error: "作品の掲載にはクリエイター登録が必要です。" },
          { status: 403 },
        );
      const { categories, ...input } = profileInput.parse(body);
      const values = {
        ...input,
        category: categories.join(CATEGORY_SEPARATOR),
        budget: input.budget || "応相談",
        updatedAt: new Date(),
      };
      const [saved] = await db
        .insert(profiles)
        .values({ ...values, owner })
        .onConflictDoUpdate({ target: profiles.owner, set: values })
        .returning();
      revalidateTag(PUBLIC_PROFILES_TAG, "max");
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
      if (existing) revalidateTag(PUBLIC_PROFILES_TAG, "max");
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
