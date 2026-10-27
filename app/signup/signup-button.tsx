"use client";
import { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import styles from "./signup.module.css";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22ZM6.4 13.92A6 6 0 0 1 6.09 12c0-.67.11-1.32.31-1.92V7.49H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.51l3.34-2.59ZM12 5.96c1.47 0 2.79.5 3.83 1.51l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59C7.19 7.72 9.4 5.96 12 5.96Z"
      />
    </svg>
  );
}

export default function SignupButton({
  configured,
  role,
}: {
  configured: boolean;
  role: "creator" | "seeker";
}) {
  const [pending, setPending] = useState<"signup" | "login" | null>(null);
  const inFlight = useRef(false);
  const [error, setError] = useState("");
  async function authenticate(mode: "signup" | "login") {
    if (!configured || inFlight.current) return;
    inFlight.current = true;
    setPending(mode);
    setError("");
    try {
      await signIn("google", {
        callbackUrl: mode === "signup" ? `/signup/complete?role=${role}` : "/",
      });
    } catch {
      setError("接続できませんでした。もう一度お試しください。");
      inFlight.current = false;
      setPending(null);
    }
  }
  return (
    <>
      <button
        className={styles.submit}
        type="button"
        disabled={pending !== null || !configured}
        aria-busy={pending === "signup"}
        onClick={() => authenticate("signup")}
      >
        <GoogleIcon />
        {pending === "signup" ? "Googleに接続中…" : "Googleで新規登録"}
      </button>
      <div className={styles.loginDivider}>
        <span>登録済みの方はこちら</span>
      </div>
      <button
        type="button"
        className={`${styles.submit} ${styles.login}`}
        disabled={pending !== null || !configured}
        aria-busy={pending === "login"}
        onClick={() => authenticate("login")}
      >
        <GoogleIcon />
        {pending === "login" ? "Googleに接続中…" : "Googleでログイン"}
      </button>
      <p className={styles.note}>
        登録時と同じGoogleアカウントをご利用ください。
      </p>
      {!configured && (
        <p role="status" className={styles.unavailable}>
          現在、新規登録・ログインの準備中です。公開プロフィールはご覧いただけます。
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </>
  );
}
