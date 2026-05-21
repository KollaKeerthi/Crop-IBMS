import { redirect } from "next/navigation";
import { auth } from "@/features/auth";
import { MemberList } from "@/features/team/components/member-list";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Team</h1>
      <MemberList currentUserId={session.user.id} />
    </div>
  );
}
