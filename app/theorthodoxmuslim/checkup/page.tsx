import type { Metadata } from "next";
import CheckupClient from "./checkup-client";

export const metadata: Metadata = {
  title: "Free Seerah Checkup — The Muslim Man",
  description:
    "Take the 2-minute Seerah Checkup and see where your understanding is strong, where it is scattered, and what to study next.",
  robots: { index: false, follow: false },
};

export default function CheckupPage() {
  return <CheckupClient />;
}
