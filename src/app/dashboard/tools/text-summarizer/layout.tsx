import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Text Summarizer - ToolkitHub",
  description: "AI-powered text summarization tool for quick content analysis and insights.",
};

export default function TextSummarizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}