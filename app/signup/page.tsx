import Link from "next/link";
import Image from "next/image";
import { Check, Heart, ArrowUpRight, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, isAuthConfigured } from "@/auth";
import SignupButton from "./signup-button";
import styles from "./signup.module.css";

export const metadata = { title: "新規登録 | Find Good" };
export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = isAuthConfigured();
  if (configured && (await auth())?.user?.id) redirect("/?onboarding=1");
  const { error } = await searchParams;
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span>F</span>Find Good
        </Link>
        <Link href="/" className={styles.home}>
          トップに戻る <ArrowUpRight size={17} />
        </Link>
      </header>
      <main className={styles.main}>
        <section className={styles.story} aria-labelledby="signup-headline">
          <p className={styles.eyebrow}>FIND YOUR NEXT CONNECTION</p>
          <h1 id="signup-headline">
            あなたの「<mark>得意</mark>」が、
            <br />
            誰かとつながる。
          </h1>
          <p className={styles.lead}>作品とスキルから、新しい出会いを。</p>
          <div className={styles.art} aria-label="掲載作品のサンプル">
            <span className={styles.star} aria-hidden="true">
              ✳
            </span>
            <div className={styles.orbit} aria-hidden="true" />
            <figure className={styles.work}>
              <div className={styles.picture}>
                <Image
                  src="/art/illustration.webp"
                  alt="イラスト作品のサンプル"
                  fill
                  sizes="(max-width: 700px) 42vw, 260px"
                />
                <Heart aria-hidden="true" />
              </div>
              <figcaption>
                <small>イラスト</small>
                <strong>小林 まどか</strong>
                <span>SAMPLE WORK</span>
              </figcaption>
            </figure>
            <figure className={styles.work}>
              <div className={styles.picture}>
                <Image
                  src="/art/brand.webp"
                  alt="ブランディング作品のサンプル"
                  fill
                  sizes="(max-width: 700px) 42vw, 260px"
                />
                <Heart aria-hidden="true" />
              </div>
              <figcaption>
                <small>ブランディング</small>
                <strong>佐藤 はるか</strong>
                <span>SAMPLE WORK</span>
              </figcaption>
            </figure>
          </div>
        </section>
        <section className={styles.card} aria-labelledby="signup-title">
          <span className={styles.badge}>無料ではじめる</span>
          <h2 id="signup-title">新規登録</h2>
          <p className={styles.subtitle}>あなたの「いいな」を見つけよう。</p>
          <ul className={styles.benefits}>
            {[
              "お気に入りの人を保存",
              "作品やスキルを掲載",
              "仕事の相談につながる",
            ].map((text) => (
              <li key={text}>
                <span>
                  <Check size={21} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          {error && (
            <p role="alert" className={styles.error}>
              認証を完了できませんでした。もう一度お試しください。
            </p>
          )}
          <p className={styles.legalNote}>
            ご利用前に<Link href="/terms">利用規約</Link>と
            <Link href="/privacy">プライバシーポリシー</Link>
            をご確認ください（現在は草案です）。
          </p>
          <SignupButton configured={configured} />
          <div className={styles.bottom}>
            <p>プロフィールは保存するまで公開されません。</p>
            <Link href="/">
              登録せずに見てみる <ArrowRight size={18} />
            </Link>
          </div>
        </section>
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
