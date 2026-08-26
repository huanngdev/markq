import { redirect } from "next/navigation";

export default function AttemptsPage() {
  redirect("/?status=completed");
}
