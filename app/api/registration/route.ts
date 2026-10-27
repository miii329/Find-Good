import { auth, isAuthConfigured } from "@/auth";
import { getDb } from "@/db";
import { creatorRegistrations, seekerRegistrations } from "@/db/schema";
import { getRegistration } from "@/lib/registration-store";
import { isSameOrigin } from "@/lib/validation";
import { registrationInput, registrationDestination } from "@/lib/registration";
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "不正なリクエストです。" }, { status: 403 });
  if (!isAuthConfigured())
    return Response.json(
      { error: "現在、登録の準備中です。" },
      { status: 503 },
    );
  try {
    const session = await auth();
    if (!session?.user.id)
      return Response.json(
        { error: "ログインしてください。" },
        { status: 401 },
      );
    const parsed = registrationInput.safeParse(await request.json());
    if (!parsed.success)
      return Response.json(
        { error: "登録種別を選択してください。" },
        { status: 400 },
      );
    const db = getDb();
    const table =
      parsed.data.role === "creator"
        ? creatorRegistrations
        : seekerRegistrations;
    await db
      .insert(table)
      .values({ userId: session.user.id })
      .onConflictDoNothing();
    const saved = await getRegistration(session.user.id);
    if (!saved) throw new Error("Registration was not saved");
    return Response.json(
      {
        role: saved.role,
        destination: registrationDestination(parsed.data.role),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json(
        { error: "入力内容をご確認ください。" },
        { status: 400 },
      );
    console.error("Registration failed", error);
    return Response.json(
      { error: "登録を保存できませんでした。時間をおいてお試しください。" },
      { status: 500 },
    );
  }
}
