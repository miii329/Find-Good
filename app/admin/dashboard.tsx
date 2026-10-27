"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  canTransition,
  statuses,
  statusLabels,
  type ContactStatus,
} from "@/lib/contact";
import styles from "./page.module.css";
type Row = {
  id: string;
  message: string;
  status: ContactStatus;
  adminNote: string;
  createdAt: string;
  requester: string | null;
  email: string | null;
  creator: string;
  creatorEmail: string;
  url: string;
};
export default function Dashboard({
  rows,
  counts,
}: {
  rows: Row[];
  counts: { status: ContactStatus; count: number }[];
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const visible = rows.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      `${r.requester} ${r.email} ${r.creator} ${r.message}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className={styles.stats}>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
          >
            <span>{statusLabels[s]}</span>
            <strong>{counts.find((c) => c.status === s)?.count ?? 0}</strong>
          </button>
        ))}
      </div>
      <div className={styles.toolbar}>
        <input
          aria-label="このページの申請を検索"
          placeholder="申請者・クリエイター・相談内容で検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="状態で絞り込む"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">すべての状態</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>
      <p className={styles.muted}>
        検索・絞り込みはこのページの最大50件が対象です。件数カードは全申請の集計です。
      </p>
      <div className={styles.list}>
        {visible.length ? (
          visible.map((r) => (
            <RequestCard key={`${r.id}-${r.status}-${r.adminNote}`} row={r} />
          ))
        ) : (
          <p className={styles.empty}>該当する申請はありません。</p>
        )}
      </div>
    </>
  );
}
function RequestCard({ row }: { row: Row }) {
  const router = useRouter();
  const [status, setStatus] = useState(row.status);
  const [note, setNote] = useState(row.adminNote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          previousStatus: row.status,
          status,
          adminNote: note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      router.refresh();
      setError("保存しました。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存できませんでした。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={styles.card}>
      <div className={styles.cardhead}>
        <span className={styles.badge}>{statusLabels[row.status]}</span>
        <time>
          {new Date(row.createdAt).toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
          })}
        </time>
      </div>
      <h2>
        {row.requester || "名前未登録"} <span>→</span> {row.creator}
      </h2>
      <p className={styles.muted}>申請者：{row.email}</p>
      <p className={styles.message}>{row.message}</p>
      <details>
        <summary>審査・取次を管理する</summary>
        <div className={styles.review}>
          <label>
            ステータス
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactStatus)}
            >
              {statuses
                .filter((s) => canTransition(row.status, s))
                .map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
            </select>
          </label>
          <label>
            管理メモ（管理者のみ閲覧）
            <textarea
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="確認事項・取次日・対応内容など"
            />
          </label>
          {row.status === "approved" && (
            <div className={styles.handoff}>
              <strong>承認済み：手動での取次待ち</strong>
              <p>
                クリエイター連絡先：{row.creatorEmail || "メールアドレス未登録"}
              </p>
              <p>
                申請者の連絡先と相談内容を取り次いだ後、「取次済み」に変更してください。保存だけではメールは送信されません。
              </p>
            </div>
          )}
          <button disabled={busy} onClick={save}>
            {busy ? "保存中…" : "変更を保存"}
          </button>
          <p role="status">{error}</p>
        </div>
      </details>
    </article>
  );
}
