"use client";
import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./thumbnail-field.module.css";
function Preview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const valid = /^https?:\/\//i.test(src);
  if (!valid || failed)
    return (
      <div className={styles.empty}>
        <ImagePlus size={28} aria-hidden="true" />
        <span>
          {failed
            ? "画像を読み込めませんでした。URLをご確認ください。"
            : "サムネイルを設定"}
        </span>
      </div>
    );
  return (
    <Image
      unoptimized
      src={src}
      alt="サムネイルのプレビュー"
      width={640}
      height={480}
      onError={() => setFailed(true)}
      className={styles.preview}
    />
  );
}
export default function ThumbnailField({
  value,
  uploading,
  onChange,
  onUpload,
}: {
  value: string;
  uploading: boolean;
  onChange: (value: string) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <fieldset className={styles.field}>
      <legend>サムネイル設定</legend>
      <p className={styles.help}>
        一覧カードとプロフィール詳細に表示する代表作品の画像です。
      </p>
      <div className={styles.frame}>
        <Preview key={value} src={value} />
      </div>
      <label>
        画像をアップロード
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={onUpload}
        />
      </label>
      <p className={styles.help}>
        JPEG・PNG・WebP／4MB以下。横長の画像がおすすめです。
      </p>
      <label>
        画像URLから設定（任意）
        <input
          name="image"
          type="url"
          maxLength={2000}
          disabled={uploading}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      </label>
      {value && (
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => onChange("")}
        >
          サムネイルの設定を解除
        </Button>
      )}
      <p className={styles.help} role="status">
        {uploading
          ? "画像をアップロード中…"
          : "「プロフィールを保存する」を押すと反映されます。"}
      </p>
    </fieldset>
  );
}
