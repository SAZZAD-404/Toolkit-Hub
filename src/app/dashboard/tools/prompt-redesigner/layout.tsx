import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Redesigner - ToolkitHub",
  description: "AI prompt optimization tool for better results and enhanced creativity.",
};

export default function PromptRedesignerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}