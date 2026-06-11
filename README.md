# Forest Stone Villa Presentation

森の中の高級別荘を、縦スクロールで巡る建築プレゼンテーションサイトです。1本のMP4を自動再生せず、スクロール量に応じて `video.currentTime` を制御します。

## セットアップ

```bash
pnpm install
```

このプロジェクトでは React + Vite を使います。依存関係は `package.json` に記載しています。npm を使う場合は `npm install` でもセットアップできます。

## 開発サーバー

```bash
pnpm dev
```

表示されたローカルURLをブラウザで開いて確認します。

## テスト

```bash
pnpm test
```

TypeScript の型チェックを実行します。

## Build

```bash
pnpm build
```

`dist/` に GitHub Pages 配信用のファイルが生成されます。Vite の `base` は `/forest-stone-villa/` に設定しています。

npm を使う場合は、それぞれ `npm run dev`、`npm test`、`npm run build` に読み替えてください。

## GitHub Pages へのデプロイ

このリポジトリは `main` ブランチへのpushで `.github/workflows/deploy-pages.yml` が動き、GitHub Pagesへ自動デプロイされます。

1. GitHub Pages の配信元を `GitHub Actions` に設定します。
2. `main` ブランチへpushします。
3. Actions の `Deploy GitHub Pages` が完了すると公開されます。

別のリポジトリ名で公開する場合は、`vite.config.ts` の `base` を現在の公開パスに合わせてください。

## 動画ファイルの差し替え

差し替えたい動画を次のパスに配置します。

```text
public/assets/videos/villa_walkthrough.mp4
```

ファイル名を変える場合は、[src/App.tsx](src/App.tsx) の `videoSrc` を更新してください。

## Poster画像の差し替え

初期表示、`video` の `poster`、fallback 画像は次のファイルを使います。

```text
public/assets/images/poster-exterior-day.png
```

ファイル名を変える場合は、[src/App.tsx](src/App.tsx) の `posterSrc` を更新してください。

## シーン時間の調整

シーン位置は [src/data/scenes.ts](src/data/scenes.ts) で管理します。

`start` と `end` は動画全体を `0.0` から `1.0` とした割合です。

例:

```ts
{
  id: "living",
  title: "LIVING",
  start: 0.25,
  end: 0.38
}
```

この場合、動画全体の25%から38%までが Living シーンとして扱われます。動画内容に合わせて `start` / `end` を調整すると、キャプション表示、縦ナビのハイライト、Prev / Next の移動先が同時に変わります。
