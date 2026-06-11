export type Scene = {
  id: string;
  label: string;
  title: string;
  copy: string;
  start: number;
  end: number;
};

export const scenes: Scene[] = [
  {
    id: "exterior",
    label: "Exterior",
    title: "FOREST STONE VILLA",
    copy: "森に寄り添う、石と木の邸宅。",
    start: 0.0,
    end: 0.05,
  },
  {
    id: "entrance",
    label: "Entrance",
    title: "ENTRANCE",
    copy: "静けさの奥へ導く、深い軒下と石のアプローチ。",
    start: 0.05,
    end: 0.17,
  },
  {
    id: "living",
    label: "Living",
    title: "LIVING",
    copy: "火と石が、森の時間を受け止める。",
    start: 0.17,
    end: 0.35,
  },
  {
    id: "dining",
    label: "Dining",
    title: "DINING KITCHEN",
    copy: "自然を背景に、暮らしの中心を据える。",
    start: 0.35,
    end: 0.56,
  },
  {
    id: "bathroom",
    label: "Bathroom",
    title: "BATHROOM",
    copy: "中庭を抜け、静かな水まわりへ。",
    start: 0.56,
    end: 0.73,
  },
  {
    id: "bedroom",
    label: "Bedroom",
    title: "BEDROOM",
    copy: "上階にひらく、森と眠るための部屋。",
    start: 0.73,
    end: 0.88,
  },
  {
    id: "night",
    label: "Night",
    title: "NIGHT SCENE",
    copy: "夜の森に、建築の灯りが浮かび上がる。",
    start: 0.88,
    end: 1.0,
  },
];
