import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - ToolkitHub",
  description: "User profile settings and account management for ToolkitHub AI workspace.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}