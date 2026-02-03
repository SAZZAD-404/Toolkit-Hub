import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Text to Video - ToolkitHub",
  description: "AI-powered text-to-video generation with advanced visual effects and animations.",
};

export default function TextToVideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}