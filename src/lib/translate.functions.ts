import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  lang: z.enum(["ru", "en"]),
  texts: z.array(z.string().max(400)).min(1).max(60),
});

export const translateTexts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { generateResponse } = await import("@lovable.dev/ai-gateway");
    const target = data.lang === "ru" ? "Russian" : "English";
    const res = await generateResponse({
      model: "openai/gpt-6.1-terra",
      instructions: `You translate UI strings of a Uzbek healthcare web app (Aveluna: e-prescriptions, free state-reimbursed medicines, pharmacies) into ${target}. Return ONLY a JSON array of strings, same length and order as the input. Keep numbers, codes, brand names, drug names, emojis and punctuation. Keep strings already in ${target} unchanged.`,
      input: JSON.stringify(data.texts),
    });
    let text = "";
    for (const item of (res as { output?: { content?: { type: string; text?: string }[] }[] }).output ?? [])
      for (const c of item.content ?? []) if (c.type === "output_text" && c.text) text += c.text;
    const m = text.match(/\[[\s\S]*\]/);
    const arr = m ? (JSON.parse(m[0]) as unknown[]) : [];
    return data.texts.map((t, i) => (typeof arr[i] === "string" ? (arr[i] as string) : t));
  });
