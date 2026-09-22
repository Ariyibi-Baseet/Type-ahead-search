import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Country Typeahead",
  description:
    "A debounced country autocomplete built with React/Next.js against the REST Countries API.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
