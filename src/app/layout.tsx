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
  title: "Levan Beroshvili — Lead Software Engineer",
  description:
    "Lead Software Engineer at EPAM Systems, experienced in leading some of the world's biggest companies' most significant projects. Specializing in React, Next.js, Angular, React Native, and TypeScript.",
  keywords: [
    "Levan Beroshvili",
    "Lead Software Engineer",
    "EPAM Systems",
    "Microsoft",
    "Frontend Developer",
    "React",
    "Next.js",
    "Angular",
    "React Native",
    "TypeScript",
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
