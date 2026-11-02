import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, KeyRound, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import moment from "moment";
import { toast } from "@/components/ui/use-toast";
import { ACCESS_TYPES } from "@/lib/authValidations";

const errText = (err) =>
  err?.response?.data?.error || err?.data?.error || err?.message || "Something went wrong";

export default function UserManagement() {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("adminListUsers", {});
      setUsers(res?.data?.users || []);
    } catch (err) {
      toast({ title: "Could not load users", description: errText(err), variant: "destructive" });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = !q ? (users || []) :
    (users || []).filter((u) =>
      `${u.name || ""} ${u.email || ""} ${u.access_type || ""}`.toLowerCase().includes(q)
    );

  const handleResetPassword = async (u) => {
    try {
      await base44.auth.resetPasswordRequest(u.email);
      toast({
        title: "Reset link sent",
        description: `A password reset link was emailed to ${u.email}. They will set a new password themselves.`,
      });
    } catch (err) {
      toast({ title: "Could not send reset link", description: errText(err), variant: "destructive" });
    }
  };

  const handleAccessChange = async (u, value) => {
    if (value === u.access_type) return;
    setSavingId(u.id);
    try {
      await base44.functions.invoke("adminUpdateUserAccessType", {
        user_id: u.id,
        access_type: value,
      });
      toast({ title: "Access type updated", description: `${u.email} is now ${value}.` });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, access_type: value } : x)));
    } catch (err) {
      toast({ title: "Update failed", description: errText(err), variant: "destructive" });
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to="/" label="Back to Home" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage accounts, access types, and reset passwords.</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or access type"
          className="pl-10 h-11"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Access Type</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{u.name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={u.access_type || "User"}
                        onValueChange={(v) => handleAccessChange(u, v)}
                        disabled={savingId === u.id}
                      >
                        <SelectTrigger className="h-9 w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESS_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {u.created_date ? moment(u.created_date).format("MMM D, YYYY") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(u)}
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1" />
                        Reset Password
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Passwords are never visible to anyone — not even Super Admin. Resetting sends the user a secure link to set a new password themselves, and reuse of previous passwords is blocked.
      </p>
    </div>
  );
}