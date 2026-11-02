import React, { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Loader2, Send, Sparkles } from "lucide-react";

/**
 * DigestChat — "Ask about this lecture" chat panel.
 *
 * Props:
 *   digest   {object}   required  — the digest object (must have lectureId or lecture_id)
 *   onSeek   {function} optional  — called with seconds (number) when a timestamp badge is clicked
 */
export default function DigestChat({ digest, onSeek }) {
  const [messages, setMessages] = useState([]); // { role, content, relevantTimestamps? }[]
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const lectureId = digest?.lectureId || digest?.lecture_id;

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const send = async () => {
    const question = input.trim();
    if (!question || sending) return;

    setInput("");
    setError("");

    // Optimistically add the user message
    const userMessage = { role: "user", content: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setSending(true);

    setTimeout(scrollToBottom, 0);

    try {
      // Build conversation history from existing messages (exclude the one we just added)
      const conversationHistory = messages.map(({ role, content }) => ({ role, content }));

      const response = await base44.post("/chat/ask", {
        lectureId,
        question,
        conversationHistory,
      });

      const assistantMessage = {
        role: "assistant",
        content: response.answer || "",
        relevantTimestamps: response.relevantTimestamps || [],
      };

      setMessages([...nextMessages, assistantMessage]);
    } catch (err) {
      setError(err?.message || "Could not get a response. Please try again.");
      // Roll back the optimistic user message on error
      setMessages(messages);
    } finally {
      setSending(false);
      setTimeout(scrollToBottom, 0);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card mt-6">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> Ask about this lecture
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ask follow-up questions about the digest, the topics, or anything covered in the video.
        </p>
      </div>

      {/* Message area */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No questions yet. Ask anything about this lecture.
          </p>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div key={i} className={isUser ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[85%] space-y-1.5">
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Timestamp badges */}
                  {!isUser && m.relevantTimestamps && m.relevantTimestamps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {m.relevantTimestamps.map((ts, ti) => {
                        const mm = Math.floor(ts.time / 60);
                        const ss = Math.floor(ts.time % 60);
                        const label = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
                        const snippet =
                          ts.text && ts.text.length > 40
                            ? ts.text.slice(0, 40) + "…"
                            : ts.text || "";
                        return (
                          <button
                            key={ti}
                            type="button"
                            onClick={() => onSeek && onSeek(ts.time)}
                            className={`inline-flex items-center gap-1 text-xs rounded-full border px-2 py-0.5 transition-colors ${
                              onSeek
                                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                                : "border-border bg-muted text-muted-foreground cursor-default"
                            }`}
                          >
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="font-mono">[{label}]</span>
                            {snippet && <span className="truncate max-w-[140px]">{snippet}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Thinking indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input area */}
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
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || sending}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
