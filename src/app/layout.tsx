import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for the editorial theme. The font file is only downloaded
// when text actually uses it, so the other themes pay nothing.
const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Levan Beroshvili — Lead Full-Stack Engineer",
  description:
    "Lead Full-Stack Engineer with 8+ years building products end to end — React & Next.js front-ends and Node.js/NestJS services backed by MongoDB, Redis, and Docker. Led engineering teams at Microsoft, Bank of Georgia, and EPAM Systems, including AI integration in Skype.",
  keywords: [
    "Levan Beroshvili",
    "Full-Stack Engineer",
    "Staff Engineer",
    "Lead Software Engineer",
    "Product Engineer",
    "EPAM Systems",
    "Microsoft",
    "React",
    "Next.js",
    "Node.js",
    "NestJS",
    "TypeScript",
    "Angular",
    "MongoDB",
  ],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
