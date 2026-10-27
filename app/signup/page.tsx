import Link from "next/link";
import { ArrowUpRight, ArrowRight, Brush, Search } from "lucide-react";
import styles from "./signup.module.css";
export const metadata = { title: "登録方法を選ぶ | Find Good" };
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span>F</span>Find Good
        </Link>
        <Link className={styles.home} href="/">
          トップに戻る <ArrowUpRight size={17} />
        </Link>
      </header>
      <main className={styles.chooser}>
        <p className={styles.eyebrow}>FIND YOUR NEXT CONNECTION</p>
        <h1 className={styles.choiceTitle}>あなたは、どちらではじめる？</h1>
        <p className={styles.subtitle}>
          得意を届ける人も、才能を探す人も。Find Goodで、新しい出会いを。
        </p>
        {error && (
          <p role="alert" className={styles.error}>
            認証を完了できませんでした。登録種別を選んで再度お試しください。
          </p>
        )}
        <div className={styles.choices}>
          <Link href="/signup/creator" className={styles.choice}>
            <span className={styles.choiceIcon}>
              <Brush size={30} />
            </span>
            <small>CREATOR</small>
            <h2>クリエイターとして登録</h2>
            <p>
              作品とスキルを届けて、
              <br />
              あなたの得意を仕事につなげる。
            </p>
            <ul>
              <li>プロフィール・作品を掲載</li>
              <li>得意な分野や対応状況を紹介</li>
              <li>ポートフォリオへ案内</li>
            </ul>
            <span className={styles.choiceAction}>
              作品を掲載する <ArrowRight size={18} />
            </span>
          </Link>
          <Link
            href="/signup/seeker"
            className={`${styles.choice} ${styles.seeker}`}
          >
            <span className={styles.choiceIcon}>
              <Search size={30} />
            </span>
            <small>SEEKER</small>
            <h2>シーカーとして登録</h2>
            <p>
              「つくりたい」を形にする、
              <br />
              クリエイターを探す人・企業へ。
            </p>
            <ul>
              <li>作品やスキルから探す</li>
              <li>お気に入りの人を保存</li>
              <li>外部の連絡先から仕事を相談</li>
            </ul>
            <span className={styles.choiceAction}>
              クリエイターを探す <ArrowRight size={18} />
            </span>
          </Link>
        </div>
        <p className={styles.note}>
          どちらも無料ではじめられます。登録済みの方は各ページの「Googleでログイン」をご利用ください。
        </p>
      </main>
      <footer className={styles.footer}>
        © Find Good
        <div className={styles.legalLinks}>
          <Link href="/privacy">プライバシーポリシー</Link>
          <Link href="/terms">利用規約</Link>
        </div>
      </footer>
    </div>
  );
}
