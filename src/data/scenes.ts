export type Scene = {
  id: string;
  label: string;
  title: string;
  copy: string;
  start: number;
  end: number;
  anchor: number;
};

export const scenes: Scene[] = [
  {
    id: "exterior",
    label: "会社紹介",
    title: "AIでつくる、\n建築と空間。",
    copy: "建築家の感性とAIで、\n空間のアイデアを提案します。",
    start: 0.0,
    end: 0.05,
    anchor: 0.0,
  },
  {
    id: "entrance",
    label: "設計の知見",
    title: "約30年の経験を、\nAIの提案力に。",
    copy: "設計で培った知見を、\nデザインの判断に活かします。",
    start: 0.05,
    end: 0.17,
    anchor: 0.105,
  },
  {
    id: "living",
    label: "複数案の提案",
    title: "複数の案を、\n短時間で。",
    copy: "方向性を比べながら、\n理想のデザインを探せます。",
    start: 0.17,
    end: 0.35,
    anchor: 0.225,
  },
  {
    id: "dining",
    label: "完成イメージ",
    title: "アイデアを、\n完成イメージに。",
    copy: "言葉やイメージから、\n建築・空間を具体的に描きます。",
    start: 0.35,
    end: 0.56,
    anchor: 0.435,
  },
  {
    id: "bathroom",
    label: "提案領域",
    title: "AIで広がる、\nデザイン提案。",
    copy: "建築・カタログ・新商品など、\nさまざまな分野をご提案します。",
    start: 0.56,
    end: 0.73,
    anchor: 0.61,
  },
  {
    id: "bedroom",
    label: "打ち合わせ",
    title: "画像で伝わる、\n打ち合わせ。",
    copy: "完成イメージを見ながら、\nご要望を一緒に整理します。",
    start: 0.73,
    end: 0.88,
    anchor: 0.8,
  },
  {
    id: "night",
    label: "お問い合わせ",
    title: "ご相談は、\nKAKUO AIへ。",
    copy: "KAKUO AI 株式会社\n東京都渋谷区代官山町20-23\nフォレストゲート代官山3F",
    start: 0.88,
    end: 1.0,
    anchor: 0.925,
  },
];
