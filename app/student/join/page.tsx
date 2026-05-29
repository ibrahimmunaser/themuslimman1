import { requireAuth } from "@/lib/auth";
import JoinForm from "./join-form";

export default async function JoinClassPage() {
  await requireAuth();
  return <JoinForm />;
}
