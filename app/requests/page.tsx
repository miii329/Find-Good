import { parseCategories } from "@/lib/categories";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAuthConfigured } from "@/auth";
import { getRegistration } from "@/lib/registration-store";
import { hasRole } from "@/lib/registration";
import { getDb } from "@/db";
import { contactRequests, profiles } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { statuses, type ContactStatus } from "@/lib/contact";
import styles from "./page.module.css";
import RefreshButton from "./refresh-button";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "申請状況 | Find Good",
  robots: { index: false, follow: false },
};
const labels: Record<ContactStatus, string> = {
  pending: "確認待ち",
  approved: "承認済み",
  forwarded: "取次済み",
  declined: "見送り",
};
const descriptions: Record<ContactStatus, string> = {
  pending: "管理者による確認をお待ちください。",
  approved: "承認されました。クリエイターへの取次を準備しています。",
  forwarded:
    "管理者がクリエイターへの取次を完了しました。面談の確定を意味するものではありません。",
  declined: "今回の申請は見送りとなりました。",
};
export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  if (!isAuthConfigured()) redirect("/signup/seeker");
  const session = await auth();
  if (!session?.user.id) redirect("/signup/seeker");
  const registration = await getRegistration(session.user.id);
  if (!hasRole(registration?.role, "seeker"))
    return (
      <main className={styles.page}>
        <h1>シーカー登録が必要です</h1>
        <p>現在の登録を残したまま、シーカー登録を追加できます。</p>
        <Link href="/signup/seeker">シーカー登録へ →</Link>
      </main>
    );
  const query = await searchParams;
  const status = statuses.includes(query.status as ContactStatus)
    ? (query.status as ContactStatus)
    : undefined;
  const parsedPage = Number(query.page ?? 1);
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage >= 1
      ? Math.min(parsedPage, 10000)
      : 1;
  const owner = eq(contactRequests.requesterId, session.user.id);
  const db = getDb();
  const [rows, counts] = await Promise.all([
    db
      .select({
        id: contactRequests.id,
        profileId: contactRequests.profileId,
        creator: profiles.name,
        category: profiles.category,
        status: contactRequests.status,
        message: contactRequests.message,
        createdAt: contactRequests.createdAt,
      })
      .from(contactRequests)
      .innerJoin(profiles, eq(profiles.id, contactRequests.profileId))
      .where(status ? and(owner, eq(contactRequests.status, status)) : owner)
      .orderBy(desc(contactRequests.createdAt), desc(contactRequests.id))
      .limit(21)
      .offset((page - 1) * 20),
    db
      .select({
        status: contactRequests.status,
        count: sql<number>`count(*)::int`,
      })
      .from(contactRequests)
      .where(owner)
      .groupBy(contactRequests.status),
  ]);
  const total = counts.reduce((sum, r) => sum + r.count, 0);
  const pageHref = (n: number) =>
    `/requests?page=${n}${status ? `&status=${status}` : ""}`;
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span>F</span>Find Good
        </Link>
        <Link href="/">クリエイター一覧へ ↗</Link>
      </header>
      <div className={styles.title}>
        <div>
          <p className={styles.eyebrow}>MY CONTACT REQUESTS</p>
          <h1>申請状況</h1>
          <p>「会いたい」を送った相手と、その後の状況を確認できます。</p>
        </div>
        <RefreshButton />
      </div>
      <nav className={styles.filters} aria-label="申請状況で絞り込む">
        <Link href="/requests" aria-current={!status ? "page" : undefined}>
          すべて <span>{total}</span>
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/requests?status=${s}`}
            aria-current={status === s ? "page" : undefined}
          >
            {labels[s]}{" "}
            <span>{counts.find((c) => c.status === s)?.count ?? 0}</span>
          </Link>
        ))}
      </nav>
      <section className={styles.list} aria-label="あなたの申請一覧">
        {rows.length ? (
          rows.slice(0, 20).map((row) => (
            <article className={styles.card} key={row.id}>
              <div className={styles.cardTop}>
                <span className={styles.badge} data-status={row.status}>
                  {labels[row.status]}
                </span>
                <time dateTime={row.createdAt.toISOString()}>
                  {row.createdAt.toLocaleString("ja-JP", {
                    timeZone: "Asia/Tokyo",
                  })}
                </time>
              </div>
              <p className={styles.category}>
                {parseCategories(row.category).join(" / ")}
              </p>
              <h2>{row.creator}さんに会いたい</h2>
              <p className={styles.description}>{descriptions[row.status]}</p>
              <details>
                <summary>送信したコメントを見る</summary>
                <p className={styles.comment}>{row.message}</p>
              </details>
              <Link
                className={styles.detailLink}
                href={`/contact/${row.profileId}`}
              >
                申請の詳細を見る →
              </Link>
            </article>
          ))
        ) : (
          <div className={styles.empty}>
            <h2>
              {total === 0
                ? "まだ申請はありません"
                : "この条件の申請はありません"}
            </h2>
            <p>
              {total === 0
                ? "気になるクリエイターに、コメントを添えて会いたい気持ちを届けましょう。"
                : "別の状態、または前のページを確認してください。"}
            </p>
            <Link href={total === 0 ? "/" : "/requests"}>
              {total === 0 ? "クリエイターを探す →" : "すべての申請を見る →"}
            </Link>
          </div>
        )}
      </section>
      <nav className={styles.pagination} aria-label="ページ切替">
        {page > 1 && <Link href={pageHref(page - 1)}>← 前へ</Link>}
        <span>{page}ページ</span>
        {rows.length > 20 && <Link href={pageHref(page + 1)}>次へ →</Link>}
      </nav>
      <div className={styles.back}>
        <Link href="/">← クリエイター一覧に戻る</Link>
      </div>
    </main>
  );
}
