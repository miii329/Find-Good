"use client";
import Link from "next/link";
import styles from "../signup.module.css";
export default function RegistrationError({ reset }: { reset: () => void }) {
  return (
    <main className={styles.confirmation}>
      <section className={styles.card}>
        <h1 className={styles.choiceTitle}>登録情報を読み込めませんでした</h1>
        <p className={styles.legalNote}>
          時間をおいて再度お試しください。まだ登録は完了していません。
        </p>
        <button className={styles.submit} onClick={reset}>
          もう一度試す
        </button>
        <div className={styles.bottom}>
          <Link href="/signup">登録方法の選択へ戻る</Link>
        </div>
      </section>
    </main>
  );
}
