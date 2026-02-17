import { I18nProvider, type Locale } from "@/context/i18n";
import { ThemeProvider } from "@/context/theme";

const locales: Locale[] = ["en", "ka"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ThemeProvider>
      <I18nProvider locale={locale as Locale}>{children}</I18nProvider>
    </ThemeProvider>
  );
}
