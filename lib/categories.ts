export const fieldCategories = [
  "ブランディング",
  "Webデザイン",
  "UI・UX",
  "グラフィック",
  "イラスト",
  "映像・動画",
  "ヘアデザイン",
  "インテリア",
  "その他",
] as const;
export function normalizeCategory(category: string): string {
  switch (category) {
    case "UI / UX":
      return "UI・UX";
    case "映像":
      return "映像・動画";
    case "ヘアスタイリスト":
      return "ヘアデザイン";
    case "インテリアデザイナー":
      return "インテリア";
    default:
      return category;
  }
}
/** DBの category 列には複数ジャンルをこの区切りでつないで保存する（ジャンル名に含まれない文字）。 */
export const CATEGORY_SEPARATOR = ",";
/** 保存済みの category 列を、表記をそろえ重複を除いたジャンルの配列に戻す。 */
export function parseCategories(stored: string): string[] {
  return [
    ...new Set(
      stored
        .split(CATEGORY_SEPARATOR)
        .map((c) => normalizeCategory(c.trim()))
        .filter(Boolean),
    ),
  ];
}
