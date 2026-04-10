import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyva Transport — Fleet Management System",
  description:
    "Multi-tenant SaaS platform for transport companies to manage hired vehicle operations, trip logging, weight-based revenue calculation, and owner settlement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
