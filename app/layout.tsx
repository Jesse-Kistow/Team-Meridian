import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Aggregator",
  description: "Discover, buy and manage event tickets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <ClerkProvider appearance={{ cssLayerName: "clerk" }}>
          {children}
        </ClerkProvider>
      </body>
      
    </html>
  );
}