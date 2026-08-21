import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zenith Workspace",
  description:
    "A neo-brutalist family canvas workspace with drag-and-drop cards, client-side persistence, and a 4-digit PIN vault.",
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
    <html lang="en">
      <body className="antialiased bg-[#FAFAFA] text-[#1A1A1A]">
        {children}
      </body>
    </html>
  );
}
