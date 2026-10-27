import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAuthConfigured } from "@/auth";
import { getDb } from "@/db";
import { registrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registrationInput, registrationDestination } from "@/lib/registration";
import CompleteButton from "./complete-button";
import styles from "../signup.module.css";
export const metadata = { title: "登録内容の確認 | Find Good" };
export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const parsed = registrationInput.safeParse({ role });
  if (!parsed.success) redirect("/signup");
  if (!isAuthConfigured()) redirect(`/signup/${parsed.data.role}`);
  const session = await auth();
  if (!session?.user.id) redirect(`/signup/${parsed.data.role}`);
  const [existing] = await getDb()
    .select()
    .from(registrations)
    .where(eq(registrations.userId, session.user.id));
  if (existing) redirect(registrationDestination(existing.role));
  const label = parsed.data.role === "creator" ? "クリエイター" : "シーカー";
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span>F</span>Find Good
        </Link>
      </header>
      <main className={styles.confirmation}>
        <section className={styles.card}>
          <span className={styles.badge}>あと1ステップ</span>
          <h1 className={styles.choiceTitle}>{label}として登録</h1>
          <p className={styles.subtitle}>
            {parsed.data.role === "creator"
              ? "登録後に作品とスキルを掲載しましょう。"
              : "あなたにぴったりのクリエイターを探しましょう。"}
          </p>
          <p className={styles.legalNote}>
            ご利用前に<Link href="/terms">利用規約</Link>と
            <Link href="/privacy">プライバシーポリシー</Link>
            をご確認ください（現在は草案です）。
          </p>
          <CompleteButton role={parsed.data.role} />
          <div className={styles.bottom}>
            <Link href="/signup">登録種別を選び直す</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
