import LegalPage from "../_legal/legal-page";
import { privacy } from "../_legal/content";
export const metadata = {
  title: "プライバシーポリシー | Find Good",
  description: "Find Goodの個人情報の取扱いについて（公開前確認中の草案）。",
  robots: { index: false, follow: true },
};
export default function PrivacyPage() {
  return <LegalPage kind="privacy" sections={privacy} />;
}
