import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zenith Canvas",
  description: "A shared neo-brutalist workspace with canvases, checklists, and production-ready architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#FAFAFA] text-[#1A1A1A]">
        {children}
      </body>
    </html>
  );
}
