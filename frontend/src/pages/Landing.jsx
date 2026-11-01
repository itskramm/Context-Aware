import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getAccessType } from "@/lib/authValidations";
import { Mail, Phone, Calendar, MapPin, User as UserIcon, Users, ShieldCheck, LayoutDashboard, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const firstName = name.split(' ')[0];
  const username = user?.username || data.username || user?.email || "";
  const mobile = user?.mobile_number || data.mobile_number || "";
  const birthday = user?.birthday || data.birthday || "";
  const address = user?.address || data.address || "";

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Profile</h1>
        
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold">{firstName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Account information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                <UserIcon className="w-3.5 h-3.5" /> Full name
              </label>
              <Input value={name} readOnly className="bg-muted/50" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <Input value={user?.email || ''} readOnly className="bg-muted/50" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                  <BookOpen className="w-3.5 h-3.5" /> Course / Program
                </label>
                <Input placeholder="e.g. BS Computer Science" className="bg-background" />
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5" /> Birthday
                </label>
                <Input type="date" placeholder="mm/dd/yyyy" className="bg-background" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                <MapPin className="w-3.5 h-3.5" /> Address
              </label>
              <Input placeholder="alley 99 pateros metro manila" className="bg-background" />
            </div>

            <button className="w-full sm:w-auto px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
              Save changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}