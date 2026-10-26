import LegalPage from "../_legal/legal-page";
import { terms } from "../_legal/content";
export const metadata = {
  title: "利用規約 | Find Good",
  description: "Find Goodの利用条件について（公開前確認中の草案）。",
  robots: { index: false, follow: true },
};
export default function TermsPage() {
  return <LegalPage kind="terms" sections={terms} />;
}
