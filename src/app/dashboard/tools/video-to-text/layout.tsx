import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video to Text - ToolkitHub",
  description: "AI-powered video transcription and YouTube content analysis tool.",
};

export default function VideoToTextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}