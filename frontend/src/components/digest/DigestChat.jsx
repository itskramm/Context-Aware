import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles } from "lucide-react";

const AGENT_NAME = "lecture_tutor";
const CONTEXT_PREFIX = /^\[Context:[^\]]*\]\s*/i;

export default function DigestChat({ digest }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = null;

    const start = async () => {
      setLoading(true);
      try {
        const rawConversations = await base44.agents.listConversations({ agent_name: AGENT_NAME });
        const existingConversations = Array.isArray(rawConversations)
          ? rawConversations
          : (rawConversations?.items || []);
        const existing = existingConversations.find(
          (c) => c.metadata?.digest_id === digest.id
        );
        const conv = existing || await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: {
            name: `Digest Q&A: ${digest.title}`,
            description: digest.title,
            digest_id: digest.id,
            lecture_id: digest.lecture_id,
          },
        });
        if (cancelled) return;
        setConversation(conv);
        setMessages(conv.messages || []);
        unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
          setMessages(data.messages || []);
        });
      } catch (err) {
        if (!cancelled) setError(err?.message || "Could not start the tutor.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    start();
    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [digest.id, digest.lecture_id, digest.title]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const question = input.trim();
    if (!question || !conversation) return;
    setInput("");
    setError("");
    const isFirst = !messages.some((m) => m.role === "user");
    const content = isFirst
      ? `[Context: digest_id=${digest.id}, lecture_id=${digest.lecture_id}]\n\n${question}`
      : question;
    try {
      await base44.agents.addMessage(conversation, { role: "user", content });
    } catch (err) {
      setError(err?.message || "Could not send your question.");
    }
  };

  const isThinking =
    messages.length > 0 && messages[messages.length - 1]?.role === "user";

  return (
    <div className="rounded-2xl border border-border bg-card mt-6">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> Ask about this lecture
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ask follow-up questions about the digest, the topics, or anything covered in the video.
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No questions yet. Ask anything about this lecture.
          </p>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            const text = isUser
              ? String(m.content || "").replace(CONTEXT_PREFIX, "")
              : String(m.content || "");
            return (
              <div key={m.id || i} className={isUser ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{text}</p>
                  ) : text ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        {isThinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-border">
        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question…"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || loading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}