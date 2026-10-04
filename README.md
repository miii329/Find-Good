# Find Good — ローカル開発用

公開した初版のUIと架空のサンプル3人・作品画像を、通常の **Next.js App Router + Neon PostgreSQL + Drizzle + Auth.js + Cloudinary** に移植したソースです。認証はAuth.js（Google OAuth）を採用しています。Clerkとの二重実装ではありません。

## まず画面を見る

Node.js **22.13以上**（推奨Node 22 LTS）を使用してください。

```sh
cd find-good-pnpm
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

http://localhost:3000 を開きます。環境変数が空でも閲覧用デモとして起動します。登録・お気に入り保存・画像アップロードは、以下の接続設定が必要です。未設定状態でデータを保存したふりはしません。

## 1. Neonの接続

1. https://console.neon.tech でプロジェクトを作成します。
2. ConnectからPostgreSQLの接続文字列をコピーします。Neonのpooled connectionでも利用できます。
3. `.env.local` の `DATABASE_URL` に貼り付けます。
4. 同梱のSQLを適用します。

```sh
pnpm db:migrate
```

これでユーザー・OAuthアカウント・セッション・プロフィール・お気に入りのテーブルが作成されます。架空のプロフィールは `app/data.ts` にあるため、seedコマンドは不要です。

## 2. Auth.js / Googleログイン

1. Google Cloud ConsoleでOAuth同意画面を設定します。テストモードの場合は、自分のGoogleアカウントをテストユーザーに登録してください。
2. OAuthクライアントIDを「ウェブアプリケーション」で作成します。
3. 承認済みのJavaScript生成元に `http://localhost:3000` を登録します。
4. 承認済みのリダイレクトURIに **`http://localhost:3000/api/auth/callback/google`** を登録します。
5. `.env.local` の `AUTH_GOOGLE_ID` と `AUTH_GOOGLE_SECRET` を設定します。
6. 次のコマンドで秘密鍵を生成し、表示値を `AUTH_SECRET` に設定します。

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`AUTH_URL=http://localhost:3000` のまま開発できます。設定変更後は開発サーバーを再起動してください。「Find Goodに参加する」からログインできます。ログアウトはフッターにあります。

Auth.jsのv5 APIを使っています。依存バージョンはpackage.jsonとpnpm-lock.yamlに固定しています。データベースセッション方式で、ユーザーIDを所有者キーに使用します。

## 3. Cloudinaryの接続

Cloudinary Consoleで次を取得し、`.env.local` に設定します。

```dotenv
CLOUDINARY_CLOUD_NAME=あなたのcloud_name
CLOUDINARY_API_KEY=あなたのapi_key
CLOUDINARY_API_SECRET=あなたのapi_secret
```

プロフィールフォームでJPEG / PNG / WebP（4MB以下）を選ぶと、認証済みのサーバーAPI経由でアップロードします。画像URL欄にも反映されるので、最後に「プロフィールを保存する」を押してください。Cloudinaryを未設定でも、画像URLを直接入力する方式は利用できます。

秘密鍵はサーバー側だけで使用します。`NEXT_PUBLIC_`を付けないでください。unsigned upload presetは不要です。

## 実装済み

- 名前・ジャンル・得意なこと・ツール・作品名・地域で検索
- ジャンル / お仕事募集中 / お気に入りで絞り込み
- 登録順・新着・名前順の並び替え
- プロフィール詳細とポートフォリオ・相談先へのリンク
- Googleログイン / ログアウト
- ユーザーごとのお気に入り保存
- 1ユーザー1プロフィールの登録・編集・削除
- Cloudinaryへの画像アップロード
- 未ログインの書き込み制限、所有者チェック、同一Originチェック、入力検証
- スマホ用のレスポンシブCSS

## 主なファイル

```text
app/
  page.tsx                       トップ画面
  directory.tsx                  一覧・検索・詳細・登録フォーム
  globals.css                    デザイン
  data.ts                        Designer型と架空のサンプル
  api/
    auth/[...nextauth]/route.ts   Auth.jsエンドポイント
    directory/route.ts           プロフィール / お気に入りAPI
    uploads/route.ts             CloudinaryアップロードAPI
components/ui/                   ButtonとDialog
public/art/                      サンプル作品（生成画像、WebP）
auth.ts                          Google認証 / Drizzleアダプター
lib/validation.ts                入力・Origin・画像形式の検証
db/schema.ts                     PostgreSQLテーブル定義
db/index.ts                      Neon HTTP接続（遅延初期化）
drizzle/                         初期SQLとDrizzleの履歴
.env.example                     設定例（秘密情報なし）
```

## コマンド

```sh
pnpm dev          # 開発
pnpm build        # 本番ビルド
pnpm start            # 本番ビルドをローカル起動
pnpm typecheck    # 型チェック
pnpm lint         # ESLint
pnpm test             # 入力・アクセス元・画像形式の単体テスト
pnpm format       # ソースを整形
pnpm db:generate  # schema変更後のSQL生成
pnpm db:migrate   # SQL適用
pnpm db:studio    # DBの閲覧・編集
```

## 追加開発の注意

- 初期の人物は全員架空で、作品は生成したサンプルです。
- このZIPは**ソース＋サンプルデータ**です。Sites上の登録ユーザー、実データ、認証情報は含みません。公開済み版とは別のデータベースになります。実データを移す場合は、旧認証のユーザーIDと新しいGoogleログインのユーザーIDの対応付けが必要です。
- 公開済みのSites版を変更するものではありません。この版にCloudflare / Sites / Vinext / D1依存はありません。
- 1プロフィールにつき代表作品1点のMVPです。複数作品は `works` テーブルを追加して拡張してください。
- `favorites.designer` はサンプルIDと実プロフィールIDの両方を扱うため、外部キーではありません。プロフィール削除APIで関連お気に入りも削除します。
- プロフィール削除や画像差し替え時にCloudinary上の画像は自動削除しません。フォームを保存せず離脱した画像も残ります。必要なら `publicId` の保存と不要画像の削除ジョブを追加してください。
- 公開運営用の管理者画面・掲載審査・通報・アップロード回数制限・メッセージ仲介・決済は未実装です。
- 画像はCloudinary以外のURLにも対応するため `next/image` の `unoptimized` を使用しています。配信最適化が必要ならCloudinaryの変換URL / loaderを追加できます。
- Clerkへ変更する場合は `auth.ts`・認証ルート・認証UI・API内のセッション取得を置き換え、所有者IDを移行してください。
- この版を一般公開するとプロフィールは未ログインでも閲覧できます。サイト全体を非公開にするアクセス制御は別途追加してください。

## 確認状況

型チェック、ESLint、単体テスト、本番ビルド、環境変数未設定でのローカルHTTP起動を確認しています。
**実アカウントの接続情報は同梱していないため、Google OAuthの往復・Neonへの書き込み・Cloudinaryへの実アップロードは接続設定後に確認してください。**

## 公式ドキュメント

- Next.js: https://nextjs.org/docs
- Neon / Drizzle: https://orm.drizzle.team/docs/connect-neon
- Auth.js: https://authjs.dev/getting-started/installation
- Drizzle adapter: https://authjs.dev/getting-started/adapters/drizzle
- Cloudinary: https://cloudinary.com/documentation/node_image_and_video_upload

## pnpm専用版

pnpm 10.15.0、Node.js 22.13以上を使用します。`package.json`はpnpmでも必要です。

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

既存の`.env.local`がある場合はコピーで上書きせず、その設定を引き継いでください。接続情報・実データ・依存ライブラリ本体は含みません。

## プロジェクト専用のNode.js

`pnpm-workspace.yaml` の `useNodeVersion: 22.23.3` により、pnpmがNode.jsを用意します。`pnpm dev` や `pnpm node` はこのバージョンで実行されます。Mac全体のNode.jsやnodebrewの設定は変更しません。初回はダウンロードが必要です。

```sh
pnpm node -v
pnpm dev
```

通常の `node -v` は従来のバージョンを表示します。このプロジェクトの実行バージョン確認には `pnpm node -v` を使用してください。
# Find-Good
