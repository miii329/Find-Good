import { adminSession } from "@/lib/admin";
import { getDb } from "@/db";
import { contactRequests } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canTransition, reviewInput } from "@/lib/contact";
import { isSameOrigin } from "@/lib/validation";
export async function PATCH(request: Request) {
  if (!isSameOrigin(request))
    return Response.json({ error: "不正なリクエストです。" }, { status: 403 });
  try {
    const session = await adminSession();
    if (!session)
      return Response.json(
        { error: "管理者権限が必要です。" },
        { status: 403 },
      );
    const parsed = reviewInput.safeParse(await request.json());
    if (
      !parsed.success ||
      !canTransition(parsed.data.previousStatus, parsed.data.status)
    )
      return Response.json(
        { error: "この状態には変更できません。" },
        { status: 400 },
      );
    const input = parsed.data;
    const result = await getDb()
      .update(contactRequests)
      .set({
        status: input.status,
        adminNote: input.adminNote,
        reviewedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contactRequests.id, input.id),
          eq(contactRequests.status, input.previousStatus),
        ),
      )
      .returning({ id: contactRequests.id });
    if (!result.length)
      return Response.json(
        { error: "他の操作で更新されました。再読み込みしてください。" },
        { status: 409 },
      );
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json({ error: "更新できませんでした。" }, { status: 500 });
  }
}
