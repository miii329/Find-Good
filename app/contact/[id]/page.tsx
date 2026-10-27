import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth, isAuthConfigured } from "@/auth";
import { getDb } from "@/db";
import { contactRequests, profiles, registrations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { statusLabels } from "@/lib/contact";
import ContactForm from "./form";
import styles from "../../admin/page.module.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "コンタクト申請 | Find Good",
  robots: { index: false, follow: false },
};
export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isAuthConfigured()) redirect("/signup/seeker");
  const session = await auth();
  if (!session?.user.id) redirect("/signup/seeker");
  const { id } = await params;
  const db = getDb();
  const [role] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.userId, session.user.id));
  if (role?.role !== "seeker")
    return (
      <main className={styles.page}>
        <h1>シーカー登録が必要です</h1>
        <Link href="/signup/seeker">シーカー登録へ</Link>
      </main>
    );
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!profile) notFound();
  const [existing] = await db
    .select({ status: contactRequests.status })
    .from(contactRequests)
    .where(
      and(
        eq(contactRequests.profileId, id),
        eq(contactRequests.requesterId, session.user.id),
      ),
    );
  return (
    <main className={styles.page} style={{ maxWidth: 680 }}>
      <header className={styles.header}>
        <Link href="/">Find Good</Link>
      </header>
      <p className={styles.eyebrow}>CONTACT REQUEST</p>
      <h1>{profile.name}さんに相談する</h1>
      {existing ? (
        <section className={styles.card}>
          <h2>申請状況：{statusLabels[existing.status]}</h2>
          <p>同じクリエイターへの申請は1件までです。</p>
        </section>
      ) : !profile.available ? (
        <p>現在、相談の受付を休止しています。</p>
      ) : (
        <>
          <p>
            管理者が内容を確認し、承認後にクリエイターへ取り次ぎます。送信時点で相手に直接通知されることはありません。
          </p>
          <ContactForm profileId={id} />
        </>
      )}
    </main>
  );
}
