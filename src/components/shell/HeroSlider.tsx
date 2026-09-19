import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  text: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
};

export function HeroSlider({ slides, className = "" }: { slides: HeroSlide[]; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-primary via-emerald-700 to-foreground p-8 text-primary-foreground sm:p-12 ${className}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
        <Sparkles className="h-3.5 w-3.5" /> {slide.eyebrow}
      </span>
      <h1 className="mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">{slide.title}</h1>
      <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base">{slide.text}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={slide.primary.to}>
          <Button size="lg" variant="secondary" className="rounded-md font-semibold">
            {slide.primary.label} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
        {slide.secondary && (
          <Link to={slide.secondary.to}>
            <Button size="lg" variant="outline" className="rounded-md border-primary-foreground/50 bg-transparent font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              {slide.secondary.label}
            </Button>
          </Link>
        )}
      </div>
      {slides.length > 1 && (
        <div className="mt-7 flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-7 bg-primary-foreground" : "w-3 bg-primary-foreground/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
