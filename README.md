# My Personal Website

這是一個使用 Next.js 16 建立的個人網站專案，整合了現代化的前端技術堆疊。

## 技術棧

- [Next.js 16](https://nextjs.org/) - React 框架
- [React 19](https://react.dev/) - 使用者介面函式庫
- [Chakra UI](https://chakra-ui.com/) - UI 組件庫
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Supabase](https://supabase.com/) - 後端服務
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集合

## 功能特色

- 🌓 深色/淺色模式支援
- 💨 使用 Tailwind CSS 的響應式設計
- ⚡ 使用 Chakra UI 的現代化 UI 組件
- 🔥 整合 Supabase 後端服務
- 📱 完全響應式設計

## 開始使用

### 前置需求

- Node.js 18.0 或更高版本
- npm 或 yarn

### 安裝

1. 複製專案：

```bash
git clone https://github.com/mingeydacoder/mysite.git
cd mysite
```

2. 安裝依賴：

```bash
npm install
# 或
yarn install
```

3. 建立 `.env.local` 檔案並設定環境變數：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 開發

運行開發伺服器：

```bash
npm run dev
# 或
yarn dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

### 建置

建置生產版本：

```bash
npm run build
# 或
yarn build
```

### 執行生產版本

```bash
npm run start
# 或
yarn start
```

## 專案結構

```
mysite/
├── app/                # Next.js 13+ App Router
│   ├── globals.css    # 全域樣式
│   ├── layout.tsx     # 根布局
│   └── page.tsx       # 首頁
├── components/        # React 組件
├── lib/              # 工具函數和共用邏輯
└── public/           # 靜態資源
```

## 部署

此專案可以部署到任何支援 Next.js 的平台，例如：

- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [AWS Amplify](https://aws.amazon.com/amplify/)

## 授權

此專案使用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解更多細節。
