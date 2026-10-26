import Link from "next/link";
import type { LegalSection } from "./content";
import styles from "./legal.module.css";
export default function LegalPage({
  kind,
  sections,
}: {
  kind: "privacy" | "terms";
  sections: LegalSection[];
}) {
  const title = kind === "privacy" ? "プライバシーポリシー" : "利用規約";
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span>F</span>Find Good
        </Link>
        <Link href="/">トップに戻る ↗</Link>
      </header>
      <main className={styles.main}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>LEGAL</p>
          <h1>{title}</h1>
          <p>
            {kind === "privacy"
              ? "あなたの情報を、大切に扱うために。"
              : "安心して出会いをつくるための、共通のルール。"}
          </p>
          <span className={styles.badge}>草案・公開前確認中</span>
        </div>
        <nav className={styles.tabs} aria-label="規約ページ">
          <Link
            href="/privacy"
            aria-current={kind === "privacy" ? "page" : undefined}
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/terms"
            aria-current={kind === "terms" ? "page" : undefined}
          >
            利用規約
          </Link>
        </nav>
        <div className={styles.columns}>
          <aside className={styles.toc}>
            <nav aria-label="目次">
              <h2>目次</h2>
              {sections.map((s, i) => (
                <a key={s.title} href={`#section-${i + 1}`}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>
          <article className={styles.document} aria-label={title}>
            <div className={styles.notice}>
              <strong>公開前の確認事項</strong>
              <p>
                運営者情報・お問い合わせ先・施行日は未確定です。この文書は草案であり、正式な公開版ではありません。保存地域、保存期間、削除受付等の運用も確認してから公開します。
              </p>
            </div>
            {sections.map((s, i) => (
              <section
                className={styles.section}
                key={s.title}
                id={`section-${i + 1}`}
              >
                <h2>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                {s.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {s.items && (
                  <ul>
                    {s.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <p className={styles.date}>
              草案作成日：2026年10月22日（施行日ではありません）
            </p>
          </article>
        </div>
      </main>
      <footer className={styles.footer}>
        <span>© Find Good</span>
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/terms">利用規約</Link>
      </footer>
    </div>
  );
}
