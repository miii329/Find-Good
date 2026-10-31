/**
 * プロフィール編集フォームの下書き。
 * 入力途中でモーダルを閉じたり、ページを離れたりしても続きから書けるよう、ブラウザに保存する。
 * 共用の端末で他人に見えないよう、保存・削除・ログアウトのときに消す。
 */
export type ProfileDraft = {
  name: string;
  categories: string[];
  location: string;
  skill: string;
  bio: string;
  tools: string;
  budget: string;
  title: string;
  image: string;
  url: string;
  available: boolean;
};

const KEY = "find-good:profile-draft";

export function readDraft(): ProfileDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProfileDraft) : null;
  } catch {
    return null;
  }
}

export function writeDraft(form: HTMLFormElement) {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "");
  const draft: ProfileDraft = {
    name: text("name"),
    categories: data.getAll("categories").map(String),
    location: text("location"),
    skill: text("skill"),
    bio: text("bio"),
    tools: text("tools"),
    budget: text("budget"),
    title: text("title"),
    image: text("image"),
    url: text("url"),
    available: data.get("available") === "on",
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // 保存できない環境（プライベートブラウズなど）では下書きなしで続ける。
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
