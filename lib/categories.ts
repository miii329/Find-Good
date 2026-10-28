export const fieldCategories = [
  "ブランディング", "Webデザイン", "UI・UX", "グラフィック", "イラスト",
  "映像・動画", "ヘアデザイン", "インテリア", "その他",
] as const;
export function normalizeCategory(category: string): string {
  switch (category) {
    case "UI / UX": return "UI・UX";
    case "映像": return "映像・動画";
    case "ヘアスタイリスト": return "ヘアデザイン";
    case "インテリアデザイナー": return "インテリア";
    default: return category;
  }
}
