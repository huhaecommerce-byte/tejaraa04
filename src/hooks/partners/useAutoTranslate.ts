import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateText } from "@/lib/translate.functions";

export type TranslatePair<K extends string> = {
  /** English field key */
  en: K;
  /** Arabic field key */
  ar: K;
  /** Field holds rich-text HTML */
  html?: boolean;
};

export type TranslateStatus = "idle" | "translating" | "auto" | "error";

const ARABIC = /[\u0600-\u06FF]/;

function looksArabic(value: string) {
  return ARABIC.test(value);
}

function stripHtml(value: string) {
  if (typeof document === "undefined") return value;
  const holder = document.createElement("div");
  holder.innerHTML = value;
  return holder.textContent ?? "";
}

/** Collect the text nodes of an HTML string so the markup survives translation. */
function htmlTextNodes(value: string): { doc: HTMLDivElement; nodes: Text[] } | null {
  if (typeof document === "undefined") return null;
  const doc = document.createElement("div");
  doc.innerHTML = value;
  const walker = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    if ((current.textContent ?? "").trim()) nodes.push(current as Text);
    current = walker.nextNode();
  }
  return { doc, nodes };
}

type TranslateFn = (args: { data: { text: string; from: string; to: string } }) => Promise<{ translated: string }>;

/** Translates source text, preserving HTML markup node-by-node when html is true. */
async function translateField(translate: TranslateFn, sourceText: string, from: string, to: string, html: boolean) {
  if (!html) {
    const { translated } = await translate({ data: { text: sourceText, from, to } });
    return translated;
  }
  const parsed = htmlTextNodes(sourceText);
  if (parsed && parsed.nodes.length > 0) {
    const joined = parsed.nodes.map((n) => n.textContent ?? "").join("\n");
    const { translated } = await translate({ data: { text: joined, from, to } });
    const lines = translated.split("\n");
    if (lines.length === parsed.nodes.length) {
      parsed.nodes.forEach((node, index) => { node.textContent = lines[index] ?? node.textContent; });
      return parsed.doc.innerHTML;
    }
    return `<p>${translated}</p>`;
  }
  const { translated } = await translate({ data: { text: stripHtml(sourceText), from, to } });
  return `<p>${translated}</p>`;
}

/**
 * Keeps an English field and its Arabic twin in step: whichever side the user
 * types in is translated into the other one, unless that other side was edited
 * by hand (then it is left exactly as written).
 */
export function useAutoTranslate<V extends object, K extends Extract<keyof V, string> = Extract<keyof V, string>>({
  values,
  setValues,
  pairs,
  delay = 800,
}: {
  values: V;
  setValues: (updater: (prev: V) => V) => void;
  pairs: TranslatePair<K>[];
  delay?: number;
}) {
  const translate = useServerFn(translateText);
  const [status, setStatus] = useState<Record<string, TranslateStatus>>({});
  /** Last value we wrote into a field ourselves — anything else means the user typed it. */
  const written = useRef<Record<string, string>>({});
  /** Last source text we successfully translated, per field. */
  const lastSource = useRef<Record<string, string>>({});
  const prevValues = useRef<Record<string, string>>({});
  const runId = useRef(0);

  useEffect(() => {
    const jobs: { source: K; target: K; from: string; to: string; html: boolean }[] = [];

    for (const pair of pairs) {
      const read = (key: K) => String((values as Record<string, unknown>)[key] ?? "");
      const en = read(pair.en);
      const ar = read(pair.ar);
      const prevEn = prevValues.current[pair.en] ?? "";
      const prevAr = prevValues.current[pair.ar] ?? "";

      // Which side did the user just change?
      const enChanged = en !== prevEn && en !== written.current[pair.en];
      const arChanged = ar !== prevAr && ar !== written.current[pair.ar];

      let source: K | null = null;
      if (enChanged && !arChanged) source = pair.en;
      else if (arChanged && !enChanged) source = pair.ar;

      if (!source) continue;
      const target = source === pair.en ? pair.ar : pair.en;
      const sourceText = read(source);
      const targetText = read(target);
      const plain = pair.html ? stripHtml(sourceText).trim() : sourceText.trim();

      if (plain.length < 2) continue;
      if (lastSource.current[target] === sourceText) continue;
      // Never overwrite text the supplier typed or corrected by hand.
      if (targetText && targetText !== written.current[target]) continue;

      const sourceIsArabic = source === pair.ar || looksArabic(plain);
      jobs.push({
        source,
        target,
        from: sourceIsArabic ? "ar" : "en",
        to: sourceIsArabic ? "en" : "ar",
        html: Boolean(pair.html),
      });
    }

    prevValues.current = Object.fromEntries(
      Object.entries(values as Record<string, unknown>).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
    );
    if (jobs.length === 0) return;

    const timer = setTimeout(() => {
      runId.current += 1;
      const myRun = runId.current;

      void (async () => {
        for (const job of jobs) {
          const sourceText = String((values as Record<string, unknown>)[job.source] ?? "");
          setStatus((prev) => ({ ...prev, [job.target]: "translating" }));
          try {
            const result = await translateField(translate, sourceText, job.from, job.to, job.html);

            if (myRun !== runId.current) return; // a newer edit took over
            written.current[job.target] = result;
            lastSource.current[job.target] = sourceText;
            prevValues.current = { ...prevValues.current, [job.target]: result };
            setValues((prev) => ({ ...prev, [job.target]: result }));
            setStatus((prev) => ({ ...prev, [job.target]: "auto" }));
          } catch {
            if (myRun !== runId.current) return;
            setStatus((prev) => ({ ...prev, [job.target]: "error" }));
          }
        }
      })();
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  /**
   * Re-runs the translation for one pair on demand, translating FROM the other
   * side INTO `target` — even when the supplier hand-edited the target.
   */
  const retranslate = useCallback(
    async (target: K) => {
      const pair = pairs.find((p) => p.en === target || p.ar === target);
      if (!pair) return;
      const source = target === pair.ar ? pair.en : pair.ar;
      const sourceText = String((values as Record<string, unknown>)[source] ?? "");
      const plain = pair.html ? stripHtml(sourceText).trim() : sourceText.trim();
      if (plain.length < 2) return;
      const sourceIsArabic = source === pair.ar || looksArabic(plain);
      const from = sourceIsArabic ? "ar" : "en";
      const to = sourceIsArabic ? "en" : "ar";

      runId.current += 1;
      const myRun = runId.current;
      setStatus((prev) => ({ ...prev, [target]: "translating" }));
      try {
        const result = await translateField(translate, sourceText, from, to, Boolean(pair.html));
        if (myRun !== runId.current) return;
        written.current[target] = result;
        lastSource.current[target] = sourceText;
        prevValues.current = { ...prevValues.current, [target]: result };
        setValues((prev) => ({ ...prev, [target]: result }));
        setStatus((prev) => ({ ...prev, [target]: "auto" }));
      } catch {
        if (myRun !== runId.current) return;
        setStatus((prev) => ({ ...prev, [target]: "error" }));
      }
    },
    [pairs, values, setValues, translate],
  );

  return { status, retranslate };
}
