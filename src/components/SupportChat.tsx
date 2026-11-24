import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X } from "lucide-react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const SUGGESTIONS = ["Quelles sont les formules ?", "Comment installer l'extension Chrome ?", "Comment fonctionne la génération de sites ?"];

function Badge({ big = false }: { big?: boolean }) {
  return <span className={`grid shrink-0 place-items-center rounded-lg border-2 border-ink bg-accent text-foreground font-display font-extrabold ${big ? "size-12 text-2xl" : "size-8 text-sm"}`}>S</span>;
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/public/chat" }),
    onError: (e) => setError(e.message.includes("429") ? "Trop de demandes, réessaie dans un instant." : "Le service est momentanément indisponible. Réessaie."),
  });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => { if (open && !busy) ref.current?.focus(); }, [open, busy]);

  const send = (text: string) => { if (!text.trim() || busy) return; setError(""); sendMessage({ text }); };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-pop">
          <div className="flex items-center gap-3 border-b-2 border-ink bg-sidebar p-3 text-sidebar-foreground">
            <Badge />
            <div className="flex-1"><p className="font-display font-bold leading-tight">Scaly</p><p className="text-xs opacity-70">Assistant ScaleSaaS</p></div>
            <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-sidebar-accent"><X className="size-4" /></button>
          </div>
          <Conversation className="flex-1">
            <ConversationContent className="gap-4 p-4">
              {messages.length === 0 ? (
                <ConversationEmptyState icon={<Badge big />} title="Bonjour, je suis Scaly" description="Une question sur ScaleSaaS, les formules ou l'extension ?">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Badge big />
                    <p className="font-display font-bold">Bonjour, je suis Scaly</p>
                    <p className="text-sm text-muted-foreground">Une question sur ScaleSaaS, les formules ou l'extension ?</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => send(s)} className="rounded-full border-2 border-border px-3 py-1 text-xs hover:border-ink">{s}</button>)}
                    </div>
                  </div>
                </ConversationEmptyState>
              ) : messages.map((m) => (
                <Message key={m.id} from={m.role}>
                  <MessageContent className={m.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : "bg-transparent p-0"}>
                    {m.parts.map((p, i) => p.type === "text" ? (m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <span key={i} className="whitespace-pre-wrap">{p.text}</span>) : null)}
                  </MessageContent>
                </Message>
              ))}
              {status === "submitted" && <Shimmer className="text-sm">Scaly réfléchit…</Shimmer>}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <div className="border-t p-3">
            <PromptInput onSubmit={(msg) => send(msg.text ?? "")}>
              <PromptInputTextarea ref={ref} placeholder="Pose ta question…" className="min-h-10" />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={status} onStop={stop} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
      <button type="button" aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"} onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-4 z-50 grid size-14 place-items-center rounded-full border-2 border-ink bg-primary text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5">
        {open ? <X /> : <MessageCircle />}
      </button>
    </>
  );
}
