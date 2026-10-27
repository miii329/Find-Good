"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: 40 }}>
      <h1>申請を読み込めませんでした</h1>
      <p>DBの接続とマイグレーションを確認してください。</p>
      <button onClick={reset}>再試行</button>
    </main>
  );
}
