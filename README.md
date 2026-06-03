# My Personal Website

This is a personal website built with Next.js 16. The frontend is deployed on Vercel, and the backend uses Supabase for Auth and database services. The site includes a personal homepage, announcements, user sign-up/sign-in, posts, favorites, and responsive layouts for desktop and mobile browsing.

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - UI library
- [Chakra UI](https://chakra-ui.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Supabase](https://supabase.com/) - Auth, Postgres database, and backend services
- [Vercel](https://vercel.com/) - Website deployment platform
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

## Features

- Dark and light mode support
- Homepage announcement board for website updates and notices
- Supabase Auth sign-up, sign-in, and password reset
- Post/message feature
- Personal favorites feature
- Responsive design with Tailwind CSS for desktop and mobile browsing
- Modern UI components with Chakra UI
- Supabase backend and database integration

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/mingeydacoder/mysite.git
cd mysite
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file and configure the environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Initialize the Supabase database:

Run the project schema in the Supabase Dashboard `SQL Editor`:

```sql
-- Use supabase/schema.sql from this project
```

This schema creates the required `profiles`, `posts`, and `favorites` tables, along with Row Level Security policies.

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

Build the production version:

```bash
npm run build
# or
yarn build
```

### Run Production Build

```bash
npm run start
# or
yarn start
```

## Project Structure

```
mysite/
├── app/               # Next.js 13+ App Router
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Homepage
├── components/        # React components
├── lib/               # Utilities and shared logic
├── supabase/          # Supabase schema
└── public/            # Static assets
```

## Deployment

This website is deployed on Vercel. Configure the following environment variables in the Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

After updating environment variables, redeploy the site because `NEXT_PUBLIC_*` variables are embedded into the frontend bundle at build time.

Supabase Auth URL settings should also include the production website URL:

- `Site URL`: the production Vercel URL
- `Redirect URLs`: the production Vercel URL and any required redirect patterns

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
