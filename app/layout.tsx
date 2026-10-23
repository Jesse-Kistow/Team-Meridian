import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Aggregator",
  description: "Discover, buy and manage event tickets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider appearance={{ cssLayerName: "clerk" }}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}