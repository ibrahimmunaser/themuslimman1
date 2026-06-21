import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Places and Maps — Seerah Reference",
  description:
    "A reference to the key cities, routes, and locations mentioned in the Seerah - from Makkah and Madinah to battlefields and migration routes.",
};

export default function PlacesMapsPage() {
  redirect("/seerah?tab=reference&section=places-maps");
}
