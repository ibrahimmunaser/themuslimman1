import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { KeyPeopleContent } from "@/components/reference/key-people-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Key People in the Seerah — Seerah Reference",
  description:
    "Companions, leaders, and figures whose roles shaped the early Muslim community - a searchable reference of 132 key people from the Seerah.",
};

export default function KeyPeoplePage() {
  return (
    <>
      <Navbar />
      <KeyPeopleContent />
      <Footer />
    </>
  );
}
