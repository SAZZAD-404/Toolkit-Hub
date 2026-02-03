import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faceless Video Generator - ToolkitHub",
  description: "Advanced AI-powered faceless video script generator with neural core technology.",
};

export default function FacelessVideoGenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}