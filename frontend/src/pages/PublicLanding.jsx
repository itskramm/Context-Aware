import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import {
  GraduationCap,
  BookOpen,
  Clock,
  Search,
  Zap,
  CheckCircle2,
  Upload,
  Sparkles,
  FileText,
  PlayCircle
} from "lucide-react";

const USE_CASES = [
  {
    icon: Clock,
    title: "Missed a lecture",
    scenario: "Catch up on Tuesday's Organic Chemistry lecture before the lab",
    action: "Watch only the synthesis reactions section"
  },
  {
    icon: Search,
    title: "Preparing for exams",
    scenario: "Finals week and you have 8 hours of recorded lectures",
    action: "Generate review digest covering key theorems and problem-solving methods"
  },
  {
    icon: FileText,
    title: "Working on assignments",
    scenario: "Writing a paper on behavioral economics",
    action: "Find all lecture segments discussing prospect theory and loss aversion"
  }
];

const HOW_IT_WORKS = [
  { step: "1", title: "Upload your lecture", desc: "Video file or YouTube URL" },
  { step: "2", title: "Get instant transcript", desc: "Searchable text with timestamps" },
  { step: "3", title: "Navigate by topic", desc: "AI identifies key sections" },
  { step: "4", title: "Generate custom digest", desc: "Tailored to your study goals" }
];

export default function PublicLanding() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4A90E2] text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[#1E3A5F] dark:text-foreground text-lg">Context Aware</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex"
            >
              Log in
            </Button>
            <Button 
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/register")}
              className="bg-[#4A90E2] hover:bg-[#3A7BC8] text-white"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start free"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl sm:text-6xl font-bold text-[#1E3A5F] dark:text-foreground leading-tight">
            Find what matters in your lectures
          </h1>
          <p className="mt-6 text-xl text-[#2D2D2D]/70 dark:text-muted-foreground leading-relaxed">
            Turn hours of recorded lectures into focused study materials. Upload a lecture, tell us what you're studying for, and get the exact segments you need.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/register")}
              className="bg-[#4A90E2] hover:bg-[#3A7BC8] text-white h-12 px-8 text-base font-medium"
            >
              Start organizing lectures
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/login")}
              className="h-12 px-8 text-base"
            >
              See how it works
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <p className="text-3xl font-bold text-[#1E3A5F] dark:text-foreground">6 seconds</p>
            <p className="mt-1 text-sm text-[#2D2D2D]/60 dark:text-muted-foreground">Average transcript generation time</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#1E3A5F] dark:text-foreground">3-hour lecture</p>
            <p className="mt-1 text-sm text-[#2D2D2D]/60 dark:text-muted-foreground">Reduced to 15-minute focused digest</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#1E3A5F] dark:text-foreground">100% free</p>
            <p className="mt-1 text-sm text-[#2D2D2D]/60 dark:text-muted-foreground">No subscriptions or hidden costs</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-[#1E3A5F] dark:text-foreground mb-12">
          Built for real student scenarios
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {USE_CASES.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <div key={useCase.title} className="bg-white dark:bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-[#7B68EE]/10 text-[#7B68EE] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-[#1E3A5F] dark:text-foreground text-lg mb-2">{useCase.title}</h3>
                <p className="text-[#2D2D2D]/70 dark:text-muted-foreground text-sm mb-3">{useCase.scenario}</p>
                <p className="text-[#4A90E2] text-sm font-medium">{useCase.action}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white dark:bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-[#1E3A5F] dark:text-foreground mb-12">
            Four steps to better studying
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#4A90E2] text-white flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-semibold text-[#1E3A5F] dark:text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-[#2D2D2D]/70 dark:text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34D399]/10 text-[#059669] text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              <span>Instant processing</span>
            </div>
            <h3 className="text-2xl font-bold text-[#1E3A5F] dark:text-foreground mb-4">
              Upload and search within seconds
            </h3>
            <p className="text-[#2D2D2D]/70 dark:text-muted-foreground leading-relaxed mb-6">
              Drop a video file or paste a YouTube URL. Get a complete, searchable transcript in under 10 seconds. No waiting, no processing queues.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] mt-0.5 shrink-0" />
                <span className="text-sm text-[#2D2D2D]/80 dark:text-muted-foreground">Supports MP4, MOV, and YouTube URLs</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] mt-0.5 shrink-0" />
                <span className="text-sm text-[#2D2D2D]/80 dark:text-muted-foreground">Accurate timestamps for every sentence</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] mt-0.5 shrink-0" />
                <span className="text-sm text-[#2D2D2D]/80 dark:text-muted-foreground">Search across all your lectures at once</span>
              </li>
            </ul>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7B68EE]/10 text-[#7B68EE] text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI-powered</span>
            </div>
            <h3 className="text-2xl font-bold text-[#1E3A5F] dark:text-foreground mb-4">
              Custom digests for your goals
            </h3>
            <p className="text-[#2D2D2D]/70 dark:text-muted-foreground leading-relaxed mb-6">
              Tell us what you're studying for—an exam, an assignment, or catching up on missed content. Get a personalized digest with only the segments that matter.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] mt-0.5 shrink-0" />
                <span className="text-sm text-[#2D2D2D]/80 dark:text-muted-foreground">AI identifies key topics automatically</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] mt-0.5 shrink-0" />
                <span className="text-sm text-[#2D2D2D]/80 dark:text-muted-foreground">Jump to any section with one click</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] mt-0.5 shrink-0" />
                <span className="text-sm text-[#2D2D2D]/80 dark:text-muted-foreground">Export digests for later review</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#1E3A5F] to-[#4A90E2] text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to study smarter?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join students who are spending less time searching and more time learning.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/register")}
            className="bg-white text-[#1E3A5F] hover:bg-gray-100 h-12 px-8 text-base font-medium"
          >
            Create free account
          </Button>
          <p className="mt-4 text-sm text-blue-100">
            No credit card required · Free forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#2D2D2D]/60 dark:text-muted-foreground">
              <GraduationCap className="w-5 h-5" />
              <span className="text-sm">Context Aware — Lecture management for students</span>
            </div>
            <p className="text-sm text-[#2D2D2D]/60 dark:text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
