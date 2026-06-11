This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Themes

The site ships **four complete, visually unrelated designs**. Every design is
always reachable at its own endpoint, and `NEXT_PUBLIC_THEME` picks which one
the root URL serves (see `.env.example`):

| Endpoint     | Look                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `/cosmic`    | (root default) iOS liquid glass + 8,400 morphing WebGL particles      |
| `/terminal`  | Interactive retro CRT shell — boots, then takes real commands (`help`, `neofetch`, `sudo hire-me`…) |
| `/editorial` | Brutalist ink & acid — giant Anton typography, marquees, hover-invert |
| `/odyssey`   | Scroll-cinematic 3D night world — dev room, server corridor, guitar stage, real car timeline, snow slope, rooftop |

```bash
# e.g. serve the odyssey design at the root URL
NEXT_PUBLIC_THEME=odyssey npm run dev
```

On Vercel, set `NEXT_PUBLIC_THEME` in Project Settings → Environment Variables
and redeploy to switch the live root design — the per-theme endpoints keep
working regardless.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
