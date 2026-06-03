# My Personal Website

這是一個使用 Next.js 16 建立的個人網站專案，前端部署在 Vercel，後端使用 Supabase 提供 Auth 與資料庫服務。網站包含個人首頁、佈告欄、登入註冊、留言與收藏功能，並針對桌面與手機瀏覽做響應式設計。

## 技術棧

- [Next.js 16](https://nextjs.org/) - React 框架
- [React 19](https://react.dev/) - 使用者介面函式庫
- [Chakra UI](https://chakra-ui.com/) - UI 組件庫
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Supabase](https://supabase.com/) - Auth、Postgres database 與後端服務
- [Vercel](https://vercel.com/) - 網站部署平台
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集合

## 功能特色

- 🌓 深色/淺色模式支援
- 📢 首頁佈告欄，可展示網站更新與公告
- 🔐 Supabase Auth 登入、註冊與密碼重設
- 💬 留言功能
- ⭐ 個人收藏功能
- 💨 使用 Tailwind CSS 的響應式設計，支援桌面與手機瀏覽
- ⚡ 使用 Chakra UI 的現代化 UI 組件
- 🔥 整合 Supabase 後端服務與資料庫

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

4. 初始化 Supabase database：

到 Supabase Dashboard 的 `SQL Editor` 執行：

```sql
-- 使用專案內的 supabase/schema.sql
```

此 schema 會建立網站需要的 `profiles`、`posts`、`favorites` 資料表與 Row Level Security policies。

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
├── supabase/         # Supabase schema
└── public/           # 靜態資源
```

## 部署

此網站使用 Vercel 部署。部署時需在 Vercel 專案的 Environment Variables 設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

更新環境變數後需要重新部署，因為 `NEXT_PUBLIC_*` 變數會在 build time 寫入前端 bundle。

Supabase Auth 的 URL 設定也需要包含正式網站網址：

- `Site URL`: Vercel 正式網址
- `Redirect URLs`: Vercel 正式網址與必要的 redirect pattern

## 授權

此專案使用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解更多細節。
