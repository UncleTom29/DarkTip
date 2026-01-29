import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "DarkTip - Anonymous Tipping for Creators",
  description:
    "Privacy-preserving tipping platform for content creators using Zero-Knowledge proofs on Solana. Tip anonymously, prove support without revealing identity.",
  keywords: [
    "tipping",
    "creator economy",
    "Solana",
    "privacy",
    "zero-knowledge proofs",
    "anonymous donations",
    "content creators",
  ],
  authors: [{ name: "DarkTip" }],
  openGraph: {
    title: "DarkTip - Anonymous Tipping for Creators",
    description:
      "Privacy-preserving tipping platform using ZK proofs on Solana",
    url: "https://darktip.xyz",
    siteName: "DarkTip",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DarkTip - Anonymous Tipping for Creators",
    description:
      "Privacy-preserving tipping platform using ZK proofs on Solana",
    creator: "@darktip",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="font-sans antialiased bg-gray-950 text-gray-100 min-h-screen"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
