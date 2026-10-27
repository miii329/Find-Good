"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountRole } from "@/lib/registration";
import styles from "../signup.module.css";
export default function CompleteButton({ role }: { role: AccountRole }) {
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "登録できませんでした。");
      router.replace(result.destination);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "登録できませんでした。",
      );
      setPending(false);
      lock.current = false;
    }
  }
  return (
    <>
      <button
        type="button"
        className={styles.submit}
        disabled={pending}
        onClick={submit}
      >
        {pending ? "登録中…" : "この内容で登録する"}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}
