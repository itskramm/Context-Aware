import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import {
  GraduationCap,
  AudioLines,
  Sparkles,
  Clock,
  Upload,
  MessageSquareText,
  Clapperboard,
  Search,
  ArrowRight } from
"lucide-react";

const FEATURES = [
{
  icon: AudioLines,
  title: "Multimodal Analysis",
  desc: "Understand lecture audio, transcripts, and visual content."
},
{
  icon: Sparkles,
  title: "Personalized Digests",
  desc: "Get lecture segments based on your learning goals."
},
{
  icon: Clock,
  title: "Faster Review",
  desc: "Spend less time searching through long recordings."
}];


const WORKFLOW = [
{ icon: Upload, label: "Upload Lecture" },
{ icon: MessageSquareText, label: "Tell Us What You Need" },
{ icon: Sparkles, label: "Generate Digest" },
{ icon: Clapperboard, label: "Review Important Sections" }];


export default function PublicLanding() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-brand text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">Context-Aware</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="hero-glow pointer-events-none absolute -top-40 -right-24 w-[34rem] h-[34rem] rounded-full blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Context-aware lecture summarization
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
            Turn Long Lectures Into{" "}
            <span className="gradient-heading">Personalized Study Digests</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Find the lecture content that matters most to you without watching the entire recording.
            Tell us your learning goal, and we'll surface the segments that actually help.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="h-12 text-base" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}>
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="w-11 h-11 rounded-xl gradient-brand-soft text-brand-end flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
              </div>);

          })}
        </div>

        {/* Workflow */}
        <div className="mt-20">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-8">
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0">
            {WORKFLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.label}>
                  <div className="flex-1 flex flex-col items-center text-center px-3 py-5 rounded-xl border border-border bg-card">
                    <div className="w-10 h-10 rounded-full gradient-brand-soft text-brand-end flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                  </div>
                  {i < WORKFLOW.length - 1 &&
                  <ArrowRight className="hidden sm:block w-5 h-5 text-muted-foreground mx-1 shrink-0 rotate-90 sm:rotate-0" />
                  }
                </React.Fragment>);

            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="w-4 h-4" />
            <span>Context-Aware </span>
          </div>
          
        </div>
      </footer>
    </div>);

}