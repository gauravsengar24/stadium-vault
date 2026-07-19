import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Languages, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, GlassIcon, SectionHeader } from "@/stadium/shared/glass";
import { stadiumTranslate } from "@/stadium/shared/ai.functions";
import { LANGUAGES } from "@/stadium/shared/session";

export const Route = createFileRoute("/staff/translate")({
  component: StaffTranslate,
  head: () => ({ meta: [{ title: "Translate — Staff Console" }] }),
});

function StaffTranslate() {
  const [text, setText] = useState("");
  const [target, setTarget] = useState("es");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const r = await stadiumTranslate({ text: text.trim(), targetLanguage: target });
      setOut(r.translation);
    } catch {
      toast.error("Translation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Bridge languages" title="Live translation" />

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <GlassIcon tint="violet" className="size-12 rounded-2xl">
            <Languages className="size-6" />
          </GlassIcon>
          <div>
            <p className="text-sm font-semibold">Staff → Fan translation</p>
            <p className="text-xs text-muted-foreground">
              Type in English (or any language) and send in the fan's language.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Source
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Type your message…"
              maxLength={1000}
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:border-safety-violet"
            />
          </div>
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Translated ({target.toUpperCase()})
            </span>
            <div className="glass min-h-[calc(6*1.5rem+1.5rem)] rounded-2xl px-4 py-3 text-sm">
              {out || <span className="text-muted-foreground">Translation appears here…</span>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="glass rounded-2xl px-3 py-2.5 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-background">
                {l.label}
              </option>
            ))}
          </select>
          <button
            onClick={run}
            disabled={busy || !text.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-safety-violet px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-50"
          >
            Translate <ArrowRight className="size-4" />
          </button>
          {out && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(out);
                toast.success("Copied.");
              }}
              className="glass rounded-2xl px-4 py-2.5 text-sm"
            >
              Copy
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
