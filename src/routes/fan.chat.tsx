import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Mic, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader } from "@/stadium/shared/glass";
import { loadSession, type FanSession } from "@/stadium/shared/session";
import { stadiumChat } from "@/stadium/shared/ai.functions";

export const Route = createFileRoute("/fan/chat")({
  component: FanChat,
  head: () => ({ meta: [{ title: "AI Chat — Fan Portal" }] }),
});

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Where is the nearest restroom?",
  "Show me halal food options",
  "How do I get to the nearest first-aid?",
  "What time does the second half start?",
];

function FanChat() {
  const [session, setSession] = useState<FanSession | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm Guardian AI. Ask me about your seat, food, exits, first-aid, or anything else about the venue.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = loadSession();
    if (s?.role === "fan") setSession(s);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const seat = session
        ? `Section ${session.section} Row ${session.row} Seat ${session.seat} (${session.zone})`
        : undefined;
      const res = await stadiumChat({
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        language: session?.language ?? "en",
        seat,
      });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.includes("429") ? "Rate limited — try again shortly." : "Guardian AI is having trouble responding.");
    } finally {
      setBusy(false);
    }
  }

  function handleVoice() {
    if (typeof window === "undefined") return;
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser.");
      return;
    }
    const rec = new SR();
    rec.lang = session?.language ?? "en";
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionResultLike) => {
      const t = e.results[0][0].transcript;
      setInput(t);
    };
    rec.onerror = () => toast.error("Couldn't hear you — try again.");
    rec.start();
    toast("Listening…");
  }

  return (
    <div>
      <SectionHeader eyebrow="Multilingual" title="Guardian AI Chat" />
      <GlassCard className="flex h-[70vh] flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
          <GlassIcon tint="violet" className="size-10 rounded-xl">
            <Sparkles className="size-5" />
          </GlassIcon>
          <div>
            <p className="text-sm font-semibold">Guardian AI</p>
            <p className="text-[11px] text-safety-green">
              Online · Language: {session?.language?.toUpperCase() ?? "EN"}
            </p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} />
          ))}
          {busy && (
            <div className="glass max-w-[70%] rounded-2xl rounded-tl-sm px-4 py-3">
              <TypingDots />
            </div>
          )}
        </div>

        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="glass rounded-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border/50 px-4 py-3"
        >
          <button
            type="button"
            onClick={handleVoice}
            className="glass-icon flex size-11 items-center justify-center rounded-2xl text-muted-foreground hover:text-safety-cyan"
            title="Voice"
          >
            <Mic className="size-4" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about the venue…"
            maxLength={500}
            className="glass flex-1 rounded-2xl px-4 py-3 text-sm outline-none focus:border-safety-cyan"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex size-11 items-center justify-center rounded-2xl bg-safety-cyan text-background disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-safety-cyan/20 text-foreground"
            : "glass rounded-tl-sm"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </div>
  );
}

// Minimal shapes so we can use Web Speech without dom-lib globals
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: (e: SpeechRecognitionResultLike) => void;
  onerror: () => void;
  start: () => void;
}
interface SpeechRecognitionResultLike {
  results: { [i: number]: { [j: number]: { transcript: string } } };
}
