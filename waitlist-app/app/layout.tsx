import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedMaxx waitlist",
  description:
    "Practise PYQs, flashcards and mock tests in one place. Join the MedMaxx waitlist for early access.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
