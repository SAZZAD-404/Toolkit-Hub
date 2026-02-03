import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center - ToolkitHub",
  description: "ToolkitHub help center with FAQs, guides, and support resources.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}