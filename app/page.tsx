import Directory from "./directory";
import { getPublicProfiles } from "@/lib/public-profiles";

// 保険の再生成間隔（1日）。通常は保存・削除時のタグ無効化で作り直される。
export const revalidate = 86400;

export default async function Home() {
  const profiles = await getPublicProfiles();
  return <Directory initialProfiles={profiles} />;
}
