import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AlCheque | Sistema Contable",
  description: "Sistema de contabilidad para Centro de Educación Especial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <script
          // Set theme before React hydrates to avoid flash.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('alcheque-theme')||'light';var r=document.documentElement;if(t==='dark')r.classList.add('dark');else r.classList.remove('dark');}catch(e){}})();",
          }}
        />
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
