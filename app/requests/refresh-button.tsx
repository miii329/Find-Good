"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
export default function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className={styles.refresh}
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "更新中…" : "最新の状況に更新"}
    </button>
  );
}
