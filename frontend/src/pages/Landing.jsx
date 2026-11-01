import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getAccessType } from "@/lib/authValidations";
import { Mail, Phone, Calendar, MapPin, User as UserIcon, Users, ShieldCheck, LayoutDashboard } from "lucide-react";

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

function LinkCard({ to, icon: Icon, title, desc }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const accessType = getAccessType(user);
  const data = user?.data || {};
  const name = user?.name || data.name || user?.full_name || "Welcome";
  const username = user?.username || data.username || user?.email || "";
  const mobile = user?.mobile_number || data.mobile_number || "";
  const birthday = user?.birthday || data.birthday || "";
  const address = user?.address || data.address || "";

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {name}</h1>
        <p className="text-muted-foreground mt-1">
          You are signed in as{" "}
          <span className="font-medium text-foreground">{accessType}</span>.
        </p>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Your account</h2>
          <ProfileRow icon={UserIcon} label="Full Name" value={name} />
          <ProfileRow icon={Mail} label="Email" value={user?.email} />
          <ProfileRow icon={UserIcon} label="Username" value={username} />
          <ProfileRow icon={Phone} label="Mobile Number" value={mobile} />
          <ProfileRow icon={Calendar} label="Birthday" value={birthday} />
          <ProfileRow icon={MapPin} label="Address" value={address} />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your access</h2>
          {accessType === "Super Admin" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <LinkCard
                to="/users"
                icon={Users}
                title="User Management"
                desc="Manage accounts, access types, and reset user passwords."
              />
              <LinkCard
                to="/admin"
                icon={ShieldCheck}
                title="Admin Panel"
                desc="View accounts and the system overview."
              />
            </div>
          )}
          {accessType === "Admin" && (
            <div className="grid sm:grid-cols-1 gap-4">
              <LinkCard
                to="/admin"
                icon={ShieldCheck}
                title="Admin Panel"
                desc="View accounts and the system overview."
              />
            </div>
          )}
          {accessType === "User" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Standard user</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account details are shown here. Additional features become available as they are added to the app.
                  </p>
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Access type is assigned to your account and cannot be changed from this page.
          </p>
        </div>
      </section>
    </div>
  );
}