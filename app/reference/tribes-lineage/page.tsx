import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tribes and Lineage — Seerah Reference",
  description:
    "The major Arab tribes, their relationships, and the Prophet's ﷺ lineage traced back through Quraysh, Kinanah, and Banu Hashim.",
};

export default function TribesLineagePage() {
  redirect("/seerah?tab=reference&section=tribes-lineage");
}
