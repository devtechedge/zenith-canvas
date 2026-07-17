import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zenith Family Canvas Workspace",
  description: "An interactive, shared neo-brutalist workspace for families.",
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
