"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../admin/page.module.css";
export default function ContactForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className={styles.review}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const data = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          const res = await fetch("/api/contact-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileId,
              message: data.get("message"),
              consent: data.get("consent") === "on",
            }),
          });
          const body = await res.json();
          if (!res.ok) throw Error(body.error);
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "申請できませんでした。");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        相談内容
        <textarea
          name="message"
          required
          minLength={20}
          maxLength={3000}
          placeholder="依頼したい内容・ご予算・希望時期など（20〜3000文字）"
        />
      </label>
      <label style={{ display: "flex", alignItems: "start" }}>
        <input type="checkbox" name="consent" required />
        相談内容とアカウントの名前・メールアドレスを運営者が確認し、承認後に相手のクリエイターへ共有することに同意します。
      </label>
      <button disabled={busy}>
        {busy ? "申請中…" : "コンタクトを申請する"}
      </button>
      <p role="alert">{error}</p>
    </form>
  );
}
