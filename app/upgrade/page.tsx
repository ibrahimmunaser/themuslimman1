import { redirect } from "next/navigation";

// During early access, only Complete is available — no upgrade path needed.
// Anyone landing here (e.g. old links) is sent directly to pricing.
export default function UpgradePage() {
  redirect("/pricing");
}
