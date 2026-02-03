import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Text to Speech - ToolkitHub",
  description: "High-quality AI text-to-speech conversion with multiple voices and languages.",
};

export default function TextToSpeechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}