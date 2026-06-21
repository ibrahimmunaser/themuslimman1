import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Key People in the Seerah — Seerah Reference",
  description:
    "Companions, leaders, and figures whose roles shaped the early Muslim community - a searchable reference of 132 key people from the Seerah.",
};

export default function KeyPeoplePage() {
  redirect("/seerah?tab=reference&section=key-people");
}
