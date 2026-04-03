import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/shell/sidebar";
import { AgentDrawer } from "@/components/shell/agent-drawer";

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
          <main className="ml-[220px] max-md:ml-[52px] min-h-screen">
            {children}
          </main>
          <AgentDrawer />
        </ThemeProvider>
      </body>
    </html>
  );
}
