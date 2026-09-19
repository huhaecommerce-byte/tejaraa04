import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#10b981', '#34d399', '#fbbf24', '#fcd34d', '#ffffff'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function celebrateSignup() {
  if (prefersReducedMotion()) return;

  const defaults = {
    colors: BRAND_COLORS,
    zIndex: 9999,
    disableForReducedMotion: true,
  };

  // Center fountain
  confetti({
    ...defaults,
    particleCount: 120,
    spread: 90,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.55 },
    scalar: 1.1,
  });

  // Left cannon
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
    });
  }, 150);

  // Right cannon
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
    });
  }, 300);

  // Sparkle finish
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 60,
      spread: 120,
      startVelocity: 30,
      gravity: 0.6,
      scalar: 0.8,
      origin: { x: 0.5, y: 0.4 },
    });
  }, 600);
}

export function celebrateLogin() {
  if (prefersReducedMotion()) return;
  confetti({
    colors: BRAND_COLORS,
    zIndex: 9999,
    particleCount: 50,
    spread: 70,
    startVelocity: 35,
    origin: { x: 0.5, y: 0.2 },
    disableForReducedMotion: true,
  });
}

export function celebrateAchievement(opts?: { particleCount?: number; origin?: { x: number; y: number } }) {
  if (prefersReducedMotion()) return;
  confetti({
    colors: BRAND_COLORS,
    zIndex: 9999,
    particleCount: opts?.particleCount ?? 80,
    spread: 80,
    origin: opts?.origin ?? { x: 0.5, y: 0.5 },
    disableForReducedMotion: true,
  });
}
