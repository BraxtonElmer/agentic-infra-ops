import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/shell/sidebar";
import { AgentDrawer } from "@/components/shell/agent-drawer";
import { BottomNav } from "@/components/shell/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Axiom — Agentic DevOps",
  description: "Agentic DevOps + FinOps dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg-base text-text-primary font-[family-name:var(--font-geist-sans)]">
        <ThemeProvider>
          <Sidebar />
          <main className="md:ml-[52px] lg:ml-[220px] min-h-screen pb-14 md:pb-0">
            {children}
          </main>
          <AgentDrawer />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
