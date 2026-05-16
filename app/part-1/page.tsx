import { redirect } from "next/navigation";

// /part-1 → homepage (free Part 1 preview is visible above the fold)
export default function Part1Preview() {
  redirect("/");
}
