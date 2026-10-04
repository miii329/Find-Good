export const categories = [
  "すべて",
  "ブランディング",
  "Webデザイン",
  "UI / UX",
  "グラフィック",
  "イラスト",
];
export type Designer = {
  id: string;
  name: string;
  english: string;
  category: string;
  location: string;
  bio: string;
  skill: string;
  tools: string;
  available: boolean;
  image: string;
  title: string;
  budget: string;
  url: string;
  demo?: boolean;
};
export const demoDesigners: Designer[] = [
  {
    id: "demo-01",
    name: "佐藤 はるか",
    english: "HARUKA SATO",
    category: "ブランディング",
    location: "東京",
    bio: "らしさを見つけて、かたちにする。小さなブランドのはじまりから、パッケージやWebまで一緒に考えます。",
    skill: "ブランドの世界観づくり",
    tools: "Illustrator / Photoshop / Figma",
    available: true,
    image: "/art/brand.webp",
    title: "mellow — 暮らしに、やさしい余白を。",
    budget: "20万円〜",
    url: "",
    demo: true,
  },
  {
    id: "demo-02",
    name: "高橋 直人",
    english: "NAOTO TAKAHASHI",
    category: "グラフィック",
    location: "京都",
    bio: "文字と色の組み合わせから、記憶に残るコミュニケーションを。文化・アート領域を中心に活動しています。",
    skill: "タイポグラフィと編集",
    tools: "Illustrator / InDesign",
    available: true,
    image: "/art/editorial.webp",
    title: "FORM — かたちをめぐる、デザインの実験。",
    budget: "10万円〜",
    url: "",
    demo: true,
  },
  {
    id: "demo-03",
    name: "小林 まどか",
    english: "MADOKA KOBAYASHI",
    category: "イラスト",
    location: "福岡",
    bio: "日々の小さな幸せを、あたたかい線と色で描きます。お店のビジュアルや書籍の挿絵など、お気軽に。",
    skill: "親しみのあるイラスト",
    tools: "Procreate / Illustrator",
    available: true,
    image: "/art/illustration.webp",
    title: "GOOD MORNING — いつもの朝を、ちょっと特別に。",
    budget: "5万円〜",
    url: "",
    demo: true,
  },
];
