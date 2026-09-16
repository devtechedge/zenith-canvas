import type { Metadata } from "next";
import "./globals.css";

const PAGE_TITLE = "Zenith Workspace";
const PAGE_DESCRIPTION =
  "A neo-brutalist family canvas workspace with drag-and-drop cards, client-side persistence, and a 4-digit PIN vault.";
const SITE_URL = "https://zenith-workspace-ten.vercel.app";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  // Shared links (LinkedIn, Slack, email) render a bare URL without these.
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

const THEME_BOOT = `(function(){try{var k="zenith-ui-theme";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark")t="light";var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t;if(t==="dark")r.classList.add("dark");else r.classList.remove("dark");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
