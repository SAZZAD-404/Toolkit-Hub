import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faceless Video - ToolkitHub",
  description: "AI-powered faceless video creation with neural core technology.",
};

export default function FacelessVideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}