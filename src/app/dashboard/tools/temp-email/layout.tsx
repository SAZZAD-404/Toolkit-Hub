import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Temp Email - ToolkitHub",
  description: "Temporary email service for secure and anonymous email communication.",
};

export default function TempEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}