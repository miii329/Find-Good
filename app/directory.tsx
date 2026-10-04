"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Bookmark,
  Plus,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { categories, demoDesigners, type Designer } from "./data";
export default function Directory() {
  const [setupRequired, setSetupRequired] = useState(false),
    [uploadedImage, setUploadedImage] = useState<string | null>(null),
    [uploading, setUploading] = useState(false);
  const [designers, setDesigners] = useState<Designer[]>(demoDesigners),
    [q, setQ] = useState(""),
    [category, setCategory] = useState("すべて"),
    [available, setAvailable] = useState(false),
    [view, setView] = useState("designers"),
    [favorites, setFavorites] = useState<string[]>([]),
    [selected, setSelected] = useState<Designer | null>(null),
    [register, setRegister] = useState(false),
    [about, setAbout] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [user, setUser] = useState(false),
    [mine, setMine] = useState<Designer | null>(null),
    [sort, setSort] = useState("default");
  useEffect(() => {
    fetch("/api/directory")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json() as Promise<{
          profiles: Designer[];
          favorites: string[];
          signedIn: boolean;
          mine: Designer | null;
          setupRequired: boolean;
        }>;
      })
      .then((d) => {
        setDesigners([...demoDesigners, ...d.profiles]);
        setFavorites(d.favorites);
        setUser(d.signedIn);
        setMine(d.mine);
        setSetupRequired(d.setupRequired);
      })
      .catch(() =>
        setMessage(
          "保存データを読み込めませんでした。ページを再読み込みしてください。",
        ),
      );
  }, []);
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            t: Tool,
            o: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    Promise.resolve(
      context.registerTool(
        {
          name: "filter_designers",
          description:
            "Search the visible designer directory by keyword. Changes search UI without modifying saved data.",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string", maxLength: 100 } },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          async execute(input) {
            if (
              !input ||
              typeof input !== "object" ||
              !("query" in input) ||
              typeof input.query !== "string" ||
              input.query.length > 100 ||
              Object.keys(input).length !== 1
            )
              throw Error("query must be a string of at most 100 characters");
            setQ(input.query);
            setCategory("すべて");
            setAvailable(false);
            setView("designers");
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            );
            return { query: input.query, status: "search_applied" };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, []);
  const filtered = designers.filter(
    (d) =>
      (category === "すべて" || d.category === category) &&
      (!available || d.available) &&
      (view !== "saved" || favorites.includes(d.id)) &&
      `${d.name} ${d.category} ${d.location} ${d.skill} ${d.title} ${d.tools}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  if (sort === "name")
    filtered.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  if (sort === "new") filtered.reverse();
  async function saveFavorite(id: string) {
    if (setupRequired) {
      setMessage("READMEに沿ってNeonとGoogle認証を設定してください。");
      return;
    }
    if (!user) {
      setMessage("お気に入りを保存するにはログインしてください。");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "favorite",
          id,
          saved: !favorites.includes(id),
        }),
      });
      if (!r.ok) throw Error();
      setFavorites((await r.json()) as string[]);
    } catch {
      setMessage("保存できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }
  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setMessage("画像は4MB以下にしてください。");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const r = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await r.json()) as { url: string; error?: string };
      if (!r.ok) throw Error(data.error);
      setUploadedImage(data.url);
      setMessage(
        "画像をアップロードしました。プロフィールを保存すると反映されます。",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "アップロードに失敗しました。",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }
  async function removeProfile() {
    if (
      !mine ||
      !window.confirm("自分のプロフィールをFind Goodから削除しますか？")
    )
      return;
    setBusy(true);
    try {
      const r = await fetch("/api/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      });
      if (!r.ok) throw Error();
      setDesigners((old) => old.filter((d) => d.id !== mine.id));
      setFavorites((old) => old.filter((id) => id !== mine.id));
      setMine(null);
      setRegister(false);
      setMessage("プロフィールを削除しました。");
    } catch {
      setMessage("削除できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch("/api/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile",
          ...data,
          available: data.available === "on",
        }),
      });
      const d = (await r.json()) as Designer & { error?: string };
      if (!r.ok) throw Error(d.error);
      setDesigners((old) => [...old.filter((p) => p.id !== d.id), d]);
      setMine(d);
      setRegister(false);
      setUploadedImage(null);
      setMessage("プロフィールを保存しました。Find Goodに掲載されています。");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="header">
        <button
          className="brand"
          onClick={() => {
            setView("designers");
            setCategory("すべて");
            setQ("");
          }}
        >
          <span className="brandmark">
            F<span>↗</span>
          </span>
          <span>
            Find Good<small>FIND YOUR FAVORITE</small>
          </span>
        </button>
        <nav aria-label="メインナビゲーション">
          <button
            className={view === "designers" ? "active" : ""}
            onClick={() => setView("designers")}
          >
            デザイナーを探す
          </button>
          <button
            className={view === "works" ? "active" : ""}
            onClick={() => setView("works")}
          >
            作品から探す
          </button>
          <button
            className={view === "saved" ? "active" : ""}
            onClick={() => setView("saved")}
          >
            お気に入り{" "}
            <span>{favorites.length.toString().padStart(2, "0")}</span>
          </button>
        </nav>
        <Button className="join" onClick={() => setRegister(true)}>
          <Plus size={16} />
          {mine ? "プロフィールを編集" : "Find Goodに参加する"}
        </Button>
      </header>
      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span /> INDEPENDENT TALENT, INFINITE POSSIBILITIES.
            </div>
            <h1>
              {view === "saved" ? (
                <>
                  気になる人を、
                  <br className="mobile" />
                  お気に入りに。
                </>
              ) : (
                <>
                  あなたの「いいな」に、
                  <br className="mobile" />
                  <span>出会おう。</span>
                </>
              )}
            </h1>
            <p>あなたの「いいな」が、誰かの仕事になる。</p>
          </div>
          <button className="manifesto" onClick={() => setAbout(true)}>
            <span>
              つくる人に、
              <br />
              もっと出会いを。
            </span>
            <ArrowUpRight size={28} />
            <small>ABOUT US</small>
          </button>
        </section>
        <section className="discovery" aria-label="デザイナー検索">
          <div className="searchline">
            <label className="search">
              <Search size={21} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="名前、得意なこと、キーワードで探す"
                aria-label="名前やキーワードで検索"
              />
              {q && (
                <button aria-label="検索をクリア" onClick={() => setQ("")}>
                  <X size={18} />
                </button>
              )}
            </label>
            <label className="available">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              <span className="switch" />
              <span className="green-dot" />
              お仕事募集中のみ
            </label>
          </div>
          <div className="categoryline">
            <div className="categories">
              {categories.map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  className={category === c ? "selected" : ""}
                  onClick={() => setCategory(c)}
                >
                  {c}
                  {c === "すべて" && <span>{designers.length}</span>}
                </button>
              ))}
            </div>
            <SlidersHorizontal size={19} />
          </div>
        </section>
        <section className="results">
          <div className="resulthead">
            <h2>
              {view === "saved"
                ? "MY COLLECTION"
                : view === "works"
                  ? "EXPLORE WORKS"
                  : "MEET THE DESIGNERS"}{" "}
              <span>
                {filtered.length}{" "}
                <small>{view === "works" ? "works" : "designers"}</small>
              </span>
            </h2>
            <label className="sort">
              並び順：
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="並び順"
              >
                <option value="default">登録順</option>
                <option value="new">新着順</option>
                <option value="name">名前順</option>
              </select>
            </label>
          </div>
          <div className="grid">
            {filtered.map((d) => (
              <article className="designer" key={d.id}>
                <div className="work">
                  <button
                    className="workopen"
                    onClick={() => setSelected(d)}
                    aria-label={`${d.name}のプロフィールを見る`}
                  >
                    {d.image ? (
                      <Image
                        unoptimized
                        width={1448}
                        height={1086}
                        src={d.image}
                        alt={d.title}
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    ) : (
                      <span className="noimage">
                        {d.name}
                        <small>PORTFOLIO</small>
                      </span>
                    )}
                    <span className="workoverlay">
                      作品とプロフィールを見る <ArrowUpRight size={20} />
                    </span>
                  </button>
                  <span className="number">
                    NO. {String(designers.indexOf(d) + 1).padStart(3, "0")}
                  </span>
                  <button
                    className={
                      "bookmark " + (favorites.includes(d.id) ? "saved" : "")
                    }
                    aria-label={`${d.name}をお気に入り${favorites.includes(d.id) ? "から解除" : "に保存"}`}
                    aria-pressed={favorites.includes(d.id)}
                    disabled={busy}
                    onClick={() => saveFavorite(d.id)}
                  >
                    <Bookmark
                      size={19}
                      fill={favorites.includes(d.id) ? "currentColor" : "none"}
                    />
                  </button>
                  <span className="worklabel">{d.category}</span>
                </div>
                <div className="profileline">
                  <button className="person" onClick={() => setSelected(d)}>
                    <span
                      className={"avatar avatar-" + (designers.indexOf(d) % 3)}
                    >
                      {d.name.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{d.name}</strong>
                      <small>{d.english || "INDEPENDENT DESIGNER"}</small>
                    </span>
                  </button>
                  <span className="status">
                    {d.available ? (
                      <>
                        <i />
                        お仕事募集中
                      </>
                    ) : (
                      "現在受付休止中"
                    )}
                  </span>
                </div>
                {view === "works" ? (
                  <button className="worktitle" onClick={() => setSelected(d)}>
                    {d.title}
                  </button>
                ) : (
                  <p className="skill">{d.skill}</p>
                )}
                <div className="cardbottom">
                  <span>
                    <MapPin size={13} />
                    {d.location}
                  </span>
                  <span>{d.demo ? "DEMO PROFILE" : "MEMBER"}</span>
                  <ArrowUpRight size={17} />
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className="empty">
              <Search size={30} />
              <h3>
                {view === "saved"
                  ? "お気に入りのデザイナーを集めよう"
                  : "条件に合うデザイナーが見つかりません"}
              </h3>
              <p>
                {view === "saved"
                  ? "カードのしおりマークから保存できます。"
                  : "キーワードや絞り込み条件を変えてお試しください。"}
              </p>
              <Button
                onClick={() => {
                  setCategory("すべて");
                  setQ("");
                  setAvailable(false);
                  setView("designers");
                }}
              >
                すべてのデザイナーを見る
              </Button>
            </div>
          )}
          <p className="demonote">
            ※ DEMO
            PROFILEは架空の人物です。作品画像はこのサービスのサンプルとして生成しています。
          </p>
        </section>
        <section className="invitation">
          <div>
            <span className="eyebrow">HELLO, INDEPENDENT DESIGNERS.</span>
            <h2>
              あなたの「好き」と「得意」を、
              <br />
              待っている人がいる。
            </h2>
            <p>あなたの得意も、Find Goodで見つけてもらおう。</p>
          </div>
          <Button onClick={() => setRegister(true)}>
            無料で参加する <ArrowUpRight size={20} />
          </Button>
        </section>
      </main>
      <footer>
        <span>個人で働く人に、発見される場所を。</span>
        <button onClick={() => setAbout(true)}>
          Find Goodについて <ArrowUpRight size={14} />
        </button>
        <small>© 2026 FIND GOOD</small>
        {user && (
          <button onClick={() => signOut({ callbackUrl: "/" })}>
            ログアウト
          </button>
        )}
      </footer>
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="detail modal">
          {selected && (
            <>
              <DialogTitle>{selected.name}</DialogTitle>
              <DialogDescription>
                {selected.category} ・ {selected.location}{" "}
                {selected.demo ? "／ サンプルプロフィール" : ""}
              </DialogDescription>
              {selected.image && (
                <Image
                  unoptimized
                  width={1448}
                  height={1086}
                  className="detailimage"
                  src={selected.image}
                  alt={selected.title}
                />
              )}
              <h3>{selected.title}</h3>
              <p>{selected.bio}</p>
              <dl className="facts">
                <div>
                  <dt>得意技</dt>
                  <dd>{selected.skill}</dd>
                </div>
                <div>
                  <dt>制作ツール</dt>
                  <dd>{selected.tools}</dd>
                </div>
                <div>
                  <dt>予算目安</dt>
                  <dd>{selected.budget}</dd>
                </div>
                <div>
                  <dt>お仕事</dt>
                  <dd>
                    {selected.available ? "ご相談受付中" : "現在受付休止中"}
                  </dd>
                </div>
              </dl>
              <div className="detailactions">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => saveFavorite(selected.id)}
                >
                  <Bookmark size={16} />
                  {favorites.includes(selected.id)
                    ? "保存済み"
                    : "お気に入りに保存"}
                </Button>
                {selected.url && (
                  <Button asChild>
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ポートフォリオ・相談先 <ArrowUpRight size={16} />
                    </a>
                  </Button>
                )}
              </div>
              {selected.demo && (
                <p className="notice">
                  架空のデザイナーのため、お仕事の相談はできません。
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={register}
        onOpenChange={(o) => {
          setRegister(o);
          if (!o) setUploadedImage(null);
        }}
      >
        <DialogContent className="modal">
          <DialogTitle>
            {mine ? "プロフィールを編集" : "あなたの得意を、Find Goodに。"}
          </DialogTitle>
          <DialogDescription>
            作品と得意なことを登録して、あなたを探している人へ。掲載は無料です。
          </DialogDescription>
          {setupRequired ? (
            <div className="signin">
              <p>
                現在は閲覧用デモです。READMEに沿ってNeonとGoogle認証の環境変数を設定すると、登録・保存を利用できます。
              </p>
            </div>
          ) : !user ? (
            <div className="signin">
              <p>
                プロフィールとお気に入りを保存するため、ログインしてください。
              </p>
              <Button onClick={() => signIn("google", { callbackUrl: "/" })}>
                Googleでログイン <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <form className="form" onSubmit={submit}>
              <label>
                お名前
                <input
                  name="name"
                  required
                  maxLength={40}
                  defaultValue={mine?.name}
                  placeholder="山田 はな"
                />
              </label>
              <div className="formrow">
                <label>
                  ジャンル
                  <select name="category" defaultValue={mine?.category}>
                    {categories.slice(1).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  活動拠点
                  <input
                    name="location"
                    required
                    maxLength={40}
                    defaultValue={mine?.location}
                    placeholder="東京 / リモート"
                  />
                </label>
              </div>
              <label>
                得意なこと
                <input
                  name="skill"
                  required
                  maxLength={80}
                  defaultValue={mine?.skill}
                  placeholder="想いを伝えるブランドづくり"
                />
              </label>
              <label>
                自己紹介
                <textarea
                  name="bio"
                  required
                  maxLength={1000}
                  defaultValue={mine?.bio}
                />
              </label>
              <div className="formrow">
                <label>
                  使用ツール
                  <input
                    name="tools"
                    maxLength={100}
                    defaultValue={mine?.tools}
                    placeholder="Figma / Illustrator"
                  />
                </label>
                <label>
                  予算目安
                  <input
                    name="budget"
                    maxLength={40}
                    defaultValue={mine?.budget}
                    placeholder="10万円〜 / 応相談"
                  />
                </label>
              </div>
              <label>
                代表作品のタイトル
                <input
                  name="title"
                  required
                  maxLength={100}
                  defaultValue={mine?.title}
                />
              </label>
              <label>
                作品画像をアップロード（任意・4MB以下）
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={uploadImage}
                />
                {uploading && <span>アップロード中…</span>}
              </label>
              <label>
                作品画像のURL（任意）
                <input
                  name="image"
                  type="url"
                  value={uploadedImage ?? mine?.image ?? ""}
                  onChange={(e) => setUploadedImage(e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label>
                ポートフォリオ・相談先URL
                <input
                  name="url"
                  type="url"
                  required
                  defaultValue={mine?.url}
                  placeholder="https://…"
                />
              </label>
              <label className="checkline">
                <input
                  type="checkbox"
                  name="available"
                  defaultChecked={mine?.available ?? true}
                />
                お仕事の相談を受け付ける
              </label>
              <label className="checkline">
                <input type="checkbox" required />
                本人のプロフィールと、掲載権限のある作品を登録します。
              </label>
              <Button disabled={busy || uploading} type="submit">
                {busy ? "保存中…" : "プロフィールを保存する"}
                <ArrowRight size={16} />
              </Button>
              {mine && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={removeProfile}
                >
                  自分のプロフィールを削除
                </Button>
              )}
              <p className="notice">
                保存したプロフィールは、このアプリにアクセスできる人が閲覧できます。
              </p>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent className="modal about">
          <DialogTitle>つくる人に、もっと出会いを。</DialogTitle>
          <DialogDescription>FIND GOOD</DialogDescription>
          <p>
            Find
            Goodは、スキルを持って個人で働く人と、その人の力を必要としている人をつなぐ場所です。
          </p>
          <p>
            有名かどうかより、どんなものをつくる人なのか。作品や得意なことから、あなたにぴったりのパートナーを見つけてください。
          </p>
          <p>
            掲載は無料。気になる人への相談は、本人のポートフォリオや連絡先へ直接つながります。
          </p>
          <Button
            onClick={() => {
              setAbout(false);
              setRegister(true);
            }}
          >
            Find Goodに参加する <ArrowRight size={16} />
          </Button>
        </DialogContent>
      </Dialog>
      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          {!user && message.includes("ログイン") && (
            <button onClick={() => signIn("google", { callbackUrl: "/" })}>
              ログイン
            </button>
          )}
          <button aria-label="通知を閉じる" onClick={() => setMessage("")}>
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
