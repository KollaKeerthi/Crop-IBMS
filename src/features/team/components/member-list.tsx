"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, MoreHorizontal } from "lucide-react";
import { useFarm } from "@/lib/farm-context";
import { useTeamMembers, useUpdateMemberRole, useRemoveMember } from "../hooks";
import type { Member, MemberRole } from "../schema";
import { InviteForm } from "./invite-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: MemberRole }) {
  const classes: Record<MemberRole, string> = {
    OWNER: "bg-purple-100 text-purple-800 border-purple-200",
    MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
    WORKER: "bg-green-100 text-green-800 border-green-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes[role]}`}
    >
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}

// ── Initials helper ───────────────────────────────────────────────────────────

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email[0]?.toUpperCase() ?? "?";
}

// ── Remove confirm dialog ─────────────────────────────────────────────────────

type RemoveDialogProps = {
  member: Member | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
};

function RemoveDialog({ member, onClose, onConfirm, isPending }: RemoveDialogProps) {
  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Member</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to remove <strong>{member?.name ?? member?.email}</strong> from this
          farm?
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Removing..." : "Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type MemberListProps = {
  currentUserId: string;
};

export function MemberList({ currentUserId }: MemberListProps) {
  const { selectedFarmId } = useFarm();

  const { data: members, isLoading } = useTeamMembers(selectedFarmId);
  const updateRoleMutation = useUpdateMemberRole();
  const removeMutation = useRemoveMember();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);

  const currentMember = members?.find((m) => m.userId === currentUserId);
  const canManageRoles = currentMember?.role === "OWNER" || currentMember?.role === "MANAGER";

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to manage team members.</p>;
  }

  async function handleChangeRole(member: Member, newRole: MemberRole) {
    if (!selectedFarmId) return;
    try {
      await updateRoleMutation.mutateAsync({
        farmId: selectedFarmId,
        memberId: member.userId,
        input: { role: newRole },
      });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleRemove() {
    if (!selectedFarmId || !removingMember) return;
    try {
      await removeMutation.mutateAsync({
        farmId: selectedFarmId,
        memberId: removingMember.userId,
      });
      toast.success("Member removed");
      setRemovingMember(null);
    } catch {
      toast.error("Failed to remove member");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members && members.length > 0 ? (
                members.map((member) => {
                  const isCurrentUser = member.userId === currentUserId;
                  const isOwner = member.role === "OWNER";
                  const canAct = canManageRoles && !isCurrentUser && !isOwner;

                  return (
                    <tr key={member.userId} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {initials(member.name, member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium leading-none">
                              {member.name ?? "—"}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canAct ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                              {(["MANAGER", "WORKER"] as MemberRole[])
                                .filter((r) => r !== member.role)
                                .map((role) => (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => handleChangeRole(member, role)}
                                  >
                                    Set as {role.charAt(0) + role.slice(1).toLowerCase()}
                                  </DropdownMenuItem>
                                ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setRemovingMember(member)}
                              >
                                Remove from farm
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          {selectedFarmId && (
            <InviteForm farmId={selectedFarmId} onSuccess={() => setInviteOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Remove confirm dialog */}
      <RemoveDialog
        member={removingMember}
        onClose={() => setRemovingMember(null)}
        onConfirm={handleRemove}
        isPending={removeMutation.isPending}
      />
    </div>
  );
}
