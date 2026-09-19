import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Heading2, Heading3, Eraser } from "lucide-react";
import { useEffect, useRef } from "react";
import { sanitizeRichText } from "@/lib/partners/sanitize-html";

type Command = { label: string; icon: React.ElementType; run: () => void };

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (node && node.innerHTML !== value) node.innerHTML = value || "";
  }, [value]);

  const emit = () => onChange(sanitizeRichText(ref.current?.innerHTML ?? ""));

  const commands: Command[] = [
    { label: "Bold", icon: Bold, run: () => exec("bold") },
    { label: "Italic", icon: Italic, run: () => exec("italic") },
    { label: "Underline", icon: Underline, run: () => exec("underline") },
    { label: "Heading", icon: Heading2, run: () => exec("formatBlock", "<h3>") },
    { label: "Subheading", icon: Heading3, run: () => exec("formatBlock", "<h4>") },
    { label: "Bullet list", icon: List, run: () => exec("insertUnorderedList") },
    { label: "Numbered list", icon: ListOrdered, run: () => exec("insertOrderedList") },
    {
      label: "Link",
      icon: LinkIcon,
      run: () => {
        const url = window.prompt("Link address (https://…)");
        if (url) exec("createLink", url);
      },
    },
    { label: "Clear formatting", icon: Eraser, run: () => exec("removeFormat") },
  ];

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card">
      <div className="hide-scrollbar flex items-center gap-1 overflow-x-auto border-b border-border bg-muted/40 px-2 py-1.5">
        {commands.map(({ label, icon: Icon, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              ref.current?.focus();
              run();
              emit();
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary sm:h-8 sm:w-8"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        className="rich-text-input min-h-[160px] px-3 py-3 text-sm leading-relaxed text-foreground outline-none sm:min-h-[140px] sm:py-2 sm:text-xs"
      />
    </div>
  );
}
