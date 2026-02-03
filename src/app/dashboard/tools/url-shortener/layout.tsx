import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "URL Shortener - ToolkitHub",
  description: "Professional URL shortening service with analytics and custom domains.",
};

export default function UrlShortenerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}