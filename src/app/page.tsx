import { redirect } from "next/navigation";
import { auth } from "@/features/auth";

export default async function HomePage() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/login");
}
