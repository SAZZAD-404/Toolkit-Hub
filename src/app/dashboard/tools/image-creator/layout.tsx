import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Image Creator - ToolkitHub",
  description: "Professional AI image generation tool with multiple artistic styles and high-quality outputs.",
};

export default function ImageCreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}