import { getRegistration } from "@/lib/registration-store";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAuthConfigured } from "@/auth";
import {
  registrationInput,
  registrationDestination,
  hasRole,
} from "@/lib/registration";
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
  const existing = await getRegistration(session.user.id);
  if (hasRole(existing?.role, parsed.data.role))
    redirect(registrationDestination(parsed.data.role));
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
          <h1 className={styles.choiceTitle}>
            {label}として{existing ? "追加登録" : "登録"}
          </h1>
          {existing && (
            <p className={styles.subtitle}>
              現在の登録・プロフィールはそのままに、両方の機能を利用できるようになります。
            </p>
          )}
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
