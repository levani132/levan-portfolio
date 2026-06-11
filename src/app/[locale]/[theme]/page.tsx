import { notFound } from "next/navigation";
import { THEMES, THEME_NAMES, type ThemeName } from "@/themes/registry";

const locales = ["en", "ka"];

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    THEME_NAMES.map((theme) => ({ locale, theme }))
  );
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ locale: string; theme: string }>;
}) {
  const { theme } = await params;
  if (!(theme in THEMES)) notFound();
  const Theme = THEMES[theme as ThemeName];
  return <Theme />;
}
