import { getRegistration } from "@/lib/registration-store";
import { hasRole } from "@/lib/registration";
import { auth, isAuthConfigured } from "@/auth";
import { getDb } from "@/db";
import { contactRequests, profiles } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { contactInput } from "@/lib/contact";
import { isSameOrigin } from "@/lib/validation";
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "不正なリクエストです。" }, { status: 403 });
  if (!isAuthConfigured())
    return Response.json({ error: "現在準備中です。" }, { status: 503 });
  try {
    const session = await auth();
    if (!session?.user.id || !session.user.email)
      return Response.json(
        { error: "ログインしてください。" },
        { status: 401 },
      );
    const parsed = contactInput.safeParse(await request.json());
    if (!parsed.success)
      return Response.json(
        { error: "相談内容を20〜3000文字で入力し、共有に同意してください。" },
        { status: 400 },
      );
    const db = getDb();
    const role = await getRegistration(session.user.id);
    if (!hasRole(role?.role, "seeker"))
      return Response.json(
        { error: "シーカー登録が必要です。" },
        { status: 403 },
      );
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, parsed.data.profileId));
    if (!profile || !profile.available || profile.owner === session.user.id)
      return Response.json(
        { error: "このクリエイターへの申請は現在受け付けていません。" },
        { status: 400 },
      );
    // Recheck availability within the INSERT and deduplicate concurrent submissions.
    const rows = await db
      .insert(contactRequests)
      .select(
        db
          .select({
            id: sql<string>`gen_random_uuid()::text`.as("id"),
            requesterId: sql<string>`${session.user.id}`.as("requester_id"),
            profileId: profiles.id,
            message: sql<string>`${parsed.data.message}`.as("message"),
            status: sql<"pending">`'pending'`.as("status"),
            adminNote: sql<string>`''`.as("admin_note"),
            reviewedBy: sql<string | null>`NULL`.as("reviewed_by"),
            updatedAt: sql<Date>`now()`.as("updated_at"),
            createdAt: sql<Date>`now()`.as("created_at"),
          })
          .from(profiles)
          .where(
            and(eq(profiles.id, profile.id), eq(profiles.available, true)),
          ),
      )
      .onConflictDoNothing()
      .returning({ id: contactRequests.id });
    if (!rows.length)
      return Response.json(
        {
          error:
            "申請済み、または受付が終了しています。申請状況をご確認ください。",
        },
        { status: 409 },
      );
    return Response.json(
      { id: rows[0].id },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "申請を保存できませんでした。時間をおいてお試しください。" },
      { status: 500 },
    );
  }
}
