"use client";
import styles from "./page.module.css";
export default function RequestsError({ reset }: { reset: () => void }) {
  return (
    <main className={styles.page}>
      <h1>申請状況を読み込めませんでした</h1>
      <p>時間をおいて、もう一度お試しください。</p>
      <button className={styles.refresh} onClick={reset}>
        再試行
      </button>
    </main>
  );
}
