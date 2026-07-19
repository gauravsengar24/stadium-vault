import { describe, it, expect } from "vitest";
import { stadiumChat, stadiumTranslate } from "@/stadium/shared/ai.functions";

describe("stadiumChat input validation", () => {
  it("rejects empty messages array", async () => {
    await expect(stadiumChat({ messages: [] })).rejects.toThrow();
  });

  it("rejects too many messages", async () => {
    const messages = Array.from({ length: 31 }, (_, i) => ({
      role: "user" as const,
      content: `msg ${i}`,
    }));
    await expect(stadiumChat({ messages })).rejects.toThrow();
  });

  it("rejects invalid role", async () => {
    await expect(
      stadiumChat({ messages: [{ role: "admin", content: "hi" }] }),
    ).rejects.toThrow();
  });

  it("rejects content exceeding 4000 chars", async () => {
    await expect(
      stadiumChat({ messages: [{ role: "user", content: "x".repeat(4001) }] }),
    ).rejects.toThrow();
  });

  it("rejects non-object input", async () => {
    await expect(stadiumChat("hello")).rejects.toThrow();
  });
});

describe("stadiumTranslate input validation", () => {
  it("rejects empty text", async () => {
    await expect(stadiumTranslate({ text: "", targetLanguage: "es" })).rejects.toThrow();
  });

  it("rejects missing target language", async () => {
    await expect(stadiumTranslate({ text: "hello" })).rejects.toThrow();
  });
});
