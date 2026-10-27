"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../../admin/page.module.css";
import motion from "./success.module.css";
export default function ContactForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const pending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{
    id: string;
    message: string;
  } | null>(null);
  useEffect(() => {
    if (receipt) heading.current?.focus();
  }, [receipt]);
  if (receipt)
    return (
      <section className={motion.success} aria-labelledby="request-success">
        <div className={motion.icon} aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="29" />
            <path d="m19 32 9 9 18-19" />
          </svg>
        </div>
        <p className={motion.eyebrow}>REQUEST SENT</p>
        <h2 id="request-success" tabIndex={-1} ref={heading}>
          コンタクト申請が完了しました
        </h2>
        <p>
          コメントと申請内容を受け付けました。
          <br />
          管理者が確認・承認した後、クリエイターへ取り次ぎます。
        </p>
        <div className={motion.comment}>
          <strong>送信したコメント</strong>
          <p>{receipt.message}</p>
        </div>
        <p className={motion.receipt}>受付番号：{receipt.id}</p>
        <div className={motion.actions}>
          <Link href="/">クリエイター一覧へ</Link>
          <button type="button" onClick={() => router.refresh()}>
            申請状況を確認
          </button>
        </div>
      </section>
    );
  return (
    <form
      className={styles.review}
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending.current) return;
        const data = new FormData(e.currentTarget);
        const message = String(data.get("message") ?? "").trim();
        pending.current = true;
        setBusy(true);
        setError("");
        try {
          const res = await fetch("/api/contact-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileId,
              message,
              consent: data.get("consent") === "on",
            }),
          });
          const body = await res.json();
          if (!res.ok)
            throw Error(body.error || "申請を保存できませんでした。");
          if (res.status !== 201 || typeof body.id !== "string" || !body.id)
            throw Error(
              "申請結果を確認できませんでした。申請状況をご確認ください。",
            );
          setReceipt({ id: body.id, message });
        } catch (e) {
          setError(e instanceof Error ? e.message : "申請できませんでした。");
          pending.current = false;
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        申請コメント（必須）
        <textarea
          name="message"
          required
          minLength={20}
          maxLength={3000}
          disabled={busy}
          placeholder="依頼したい内容・ご予算・希望時期など（20〜3000文字）"
        />
      </label>
      <label style={{ display: "flex", alignItems: "start" }}>
        <input type="checkbox" name="consent" required disabled={busy} />
        相談内容とアカウントの名前・メールアドレスを運営者が確認し、承認後に相手のクリエイターへ共有することに同意します。
      </label>
      <button disabled={busy}>
        {busy ? "申請を送信中…" : "コメントを添えて申請する"}
      </button>
      <p role="alert">{error}</p>
    </form>
  );
}
