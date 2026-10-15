import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grafana Demo App",
  description: "A minimal demo target for Grafana Cloud synthetic monitoring."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
