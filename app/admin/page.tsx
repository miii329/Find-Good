import Link from "next/link";
import { notFound } from "next/navigation";
import { adminSession } from "@/lib/admin";
import { getDb } from "@/db";
import { contactRequests, profiles, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Dashboard from "./dashboard";
import styles from "./page.module.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "申請管理 | Find Good",
  robots: { index: false, follow: false },
};
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await adminSession())) notFound();
  const query = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1)) | 0;
  const db = getDb();
  const rows = await db
    .select({
      id: contactRequests.id,
      message: contactRequests.message,
      status: contactRequests.status,
      adminNote: contactRequests.adminNote,
      createdAt: contactRequests.createdAt,
      requester: users.name,
      email: users.email,
      creator: profiles.name,
      creatorId: profiles.owner,
      url: profiles.url,
    })
    .from(contactRequests)
    .innerJoin(users, eq(users.id, contactRequests.requesterId))
    .innerJoin(profiles, eq(profiles.id, contactRequests.profileId))
    .orderBy(desc(contactRequests.createdAt), desc(contactRequests.id))
    .limit(50)
    .offset((page - 1) * 50);
  const counts = await db
    .select({
      status: contactRequests.status,
      count: sql<number>`count(*)::int`,
    })
    .from(contactRequests)
    .groupBy(contactRequests.status);
  const creatorIds = [...new Set(rows.map((r) => r.creatorId))];
  // Creator emails are resolved only after the admin authorization gate.
  const { inArray } = await import("drizzle-orm");
  const creators = creatorIds.length
    ? await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.id, creatorIds))
    : [];
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/">Find Good</Link>
        <span>管理者専用</span>
      </header>
      <p className={styles.eyebrow}>CONTACT REQUESTS</p>
      <h1>コンタクト申請管理</h1>
      <p>申請を確認し、承認後にクリエイターへ取り次ぎます。</p>
      <Dashboard
        rows={rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          creatorEmail: creators.find((c) => c.id === r.creatorId)?.email ?? "",
        }))}
        counts={counts}
      />
      <nav className={styles.pagination}>
        {page > 1 && <Link href={`/admin?page=${page - 1}`}>← 前の50件</Link>}
        <span>{page}ページ</span>
        {rows.length === 50 && (
          <Link href={`/admin?page=${page + 1}`}>次の50件 →</Link>
        )}
      </nav>
    </main>
  );
}
