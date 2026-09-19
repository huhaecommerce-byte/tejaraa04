import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyRound, Shield, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/partners/AdminShell";
import { Field, GhostButton, Panel, PrimaryButton, StatusPill, inputClass } from "@/components/partners/SupplierShell";
import { brandConfig } from "@/config/partnerBrand";
import {
  createPlatformUser,
  deletePlatformUser,
  listPlatformUsers,
  resetUserPassword,
  setUserSuspended,
  updateUserRoles,
  type PlatformUser,
} from "@/lib/partners/admin-users.functions";
import { ROLE_LABELS, type AppRole } from "@/lib/partners/permissions";

export const Route = createFileRoute("/partners/admin/team")({
  head: () => ({
    meta: [
      { title: `Team & Roles | ${brandConfig.name}` },
      { name: "description", content: "Create user accounts, assign roles and control which admin pages each person can open." },
      { property: "og:title", content: `Team & Roles | ${brandConfig.name}` },
      { property: "og:description", content: "Manage platform users, roles and access limits for the Tejarx admin console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

const ASSIGNABLE: AppRole[] = ["admin", "staff", "finance", "viewer", "supplier"];

const ROLE_HINT: Record<AppRole, string> = {
  admin: "Full access to every page, including this one.",
  staff: "Applications and product approvals only.",
  finance: "Orders, performance and payouts only.",
  viewer: "Can look at pages but cannot change anything.",
  supplier: "Access to the wholesaler portal.",
};


function RoleChips({ roles }: { roles: AppRole[] }) {
  if (!roles.length) return <StatusPill label="No role" tone="neutral" />;
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <span key={role} className="rounded-lg bg-accent/70 px-2 py-0.5 text-[11px] font-bold text-foreground">
          {ROLE_LABELS[role] ?? role}
        </span>
      ))}
    </div>
  );
}

function TeamPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    roles: ["staff"] as AppRole[],
  });
  const [editing, setEditing] = useState<Record<string, AppRole[]>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "team"],
    queryFn: () => listPlatformUsers(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "team"] });
  const fail = (error: Error) => toast.error(error.message || "Something went wrong");

  const create = useMutation({
    mutationFn: () => createPlatformUser({ data: form }),
    onSuccess: () => {
      toast.success("User created. They can sign in with that email and password.");
      setForm({ firstName: "", lastName: "", username: "", email: "", password: "", roles: ["staff"] });
      refresh();
    },
    onError: fail,
  });

  const saveRoles = useMutation({
    mutationFn: (input: { userId: string; roles: AppRole[] }) => updateUserRoles({ data: input }),
    onSuccess: (_r, input) => {
      toast.success("Roles updated.");
      setEditing((prev) => {
        const next = { ...prev };
        delete next[input.userId];
        return next;
      });
      refresh();
    },
    onError: fail,
  });

  const suspend = useMutation({
    mutationFn: (input: { userId: string; suspended: boolean }) => setUserSuspended({ data: input }),
    onSuccess: (_r, input) => {
      toast.success(input.suspended ? "Account suspended." : "Account reactivated.");
      refresh();
    },
    onError: fail,
  });

  const resetPassword = useMutation({
    mutationFn: (input: { userId: string; password: string }) => resetUserPassword({ data: input }),
    onSuccess: () => toast.success("Password changed."),
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: (userId: string) => deletePlatformUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("User removed.");
      refresh();
    },
    onError: fail,
  });

  const users = (data ?? []) as PlatformUser[];

  const toggleFormRole = (role: AppRole) =>
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }));

  const rolesFor = (user: PlatformUser) => editing[user.id] ?? user.roles;

  const toggleUserRole = (user: PlatformUser, role: AppRole) => {
    const current = rolesFor(user);
    const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
    setEditing((prev) => ({ ...prev, [user.id]: next }));
  };

  const askPassword = (user: PlatformUser) => {
    const password = window.prompt(`New password for ${user.email} (at least 8 characters)`);
    if (!password) return;
    resetPassword.mutate({ userId: user.id, password });
  };

  return (
    <AdminShell title="Team & Roles" subtitle="Add people by hand, give them roles, and limit which pages they can open.">
      <Panel title="Add a user">
        <form
          className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <Field label="First name">
            <input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Last name">
            <input className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
          <Field label="Username" hint="Shown in the app. Sign-in is always by email.">
            <input className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="sara.k" />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password" hint="At least 8 characters. The account works right away.">
            <input className={inputClass} type="text" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Roles</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ASSIGNABLE.map((role) => (
                <label key={role} className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-background px-3 py-2">
                  <input type="checkbox" className="mt-0.5" checked={form.roles.includes(role)} onChange={() => toggleFormRole(role)} />
                  <span>
                    <span className="block text-xs font-bold">{ROLE_LABELS[role]}</span>
                    <span className="block text-[11px] text-muted-foreground">{ROLE_HINT[role]}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <PrimaryButton type="submit" disabled={create.isPending}>
              <UserPlus className="h-4 w-4" /> {create.isPending ? "Creating…" : "Create user"}
            </PrimaryButton>
          </div>
        </form>
      </Panel>

      <Panel title={`People (${users.length})`}>
        {isLoading ? (
          <p className="p-3 text-sm text-muted-foreground sm:p-4">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground sm:p-4">No users yet.</p>
        ) : (
          <div className="space-y-3 p-3 sm:p-4">
            {users.map((user) => {
              const current = rolesFor(user);
              const dirty = JSON.stringify([...current].sort()) !== JSON.stringify([...user.roles].sort());
              return (
                <div key={user.id} className="rounded-2xl border border-border bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold">
                        {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || user.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                        {user.username ? ` · @${user.username}` : ""}
                      </p>
                      <div className="mt-1.5"><RoleChips roles={user.roles} /></div>
                    </div>
                    <StatusPill label={user.suspended ? "Suspended" : "Active"} tone={user.suspended ? "danger" : "success"} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {ASSIGNABLE.map((role) => (
                      <label key={role} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-[11px] font-bold">
                        <input type="checkbox" checked={current.includes(role)} onChange={() => toggleUserRole(user, role)} />
                        {ROLE_LABELS[role]}
                      </label>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {dirty && (
                      <PrimaryButton
                        type="button"
                        disabled={saveRoles.isPending}
                        onClick={() => saveRoles.mutate({ userId: user.id, roles: current })}
                      >
                        <Shield className="h-4 w-4" /> Save roles
                      </PrimaryButton>
                    )}
                    <GhostButton type="button" onClick={() => askPassword(user)}>
                      <KeyRound className="h-4 w-4" /> Reset password
                    </GhostButton>
                    <GhostButton
                      type="button"
                      onClick={() => suspend.mutate({ userId: user.id, suspended: !user.suspended })}
                    >
                      {user.suspended ? "Reactivate" : "Suspend"}
                    </GhostButton>
                    <GhostButton
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove ${user.email}? This deletes their account and data.`)) {
                          remove.mutate(user.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </GhostButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
