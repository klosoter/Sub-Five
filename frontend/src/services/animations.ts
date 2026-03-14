/**
 * Card animation utilities using Web Animations API (WAAPI).
 *
 * All animations are non-blocking and return Promises that resolve when done.
 */

export interface AnimationOrigin {
  x: number;
  y: number;
}

/** Get the center point of an element relative to the viewport */
export function getCenter(el: Element): AnimationOrigin {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/** Animate a card being dealt from deck to a target position */
export function animateDeal(
  cardEl: Element,
  from: AnimationOrigin,
  delay = 0,
): Promise<void> {
  const rect = cardEl.getBoundingClientRect();
  const to = getCenter(cardEl);
  const dx = from.x - to.x;
  const dy = from.y - to.y;

  const anim = cardEl.animate(
    [
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.5)`,
        opacity: 0,
      },
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1,
      },
    ],
    {
      duration: 350,
      delay,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'backwards',
    },
  );

  return anim.finished.then(() => {});
}

/** Animate a card flying from the player's hand to the pile */
export function animatePlayToPile(
  cardEl: Element,
  pileTarget: AnimationOrigin,
): Promise<void> {
  const from = getCenter(cardEl);
  const dx = pileTarget.x - from.x;
  const dy = pileTarget.y - from.y;

  const anim = cardEl.animate(
    [
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.8)`,
        opacity: 0.3,
      },
    ],
    {
      duration: 300,
      easing: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
      fill: 'forwards',
    },
  );

  return anim.finished.then(() => {});
}

/** Animate drawing a card from deck/pile to hand */
export function animateDrawToHand(
  cardEl: Element,
  from: AnimationOrigin,
): Promise<void> {
  const to = getCenter(cardEl);
  const dx = from.x - to.x;
  const dy = from.y - to.y;

  const anim = cardEl.animate(
    [
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.8)`,
        opacity: 0.5,
      },
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 1,
      },
    ],
    {
      duration: 300,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'backwards',
    },
  );

  return anim.finished.then(() => {});
}

/** Animate card flip (face-down to face-up) */
export function animateFlip(cardEl: Element, duration = 400): Promise<void> {
  const anim = cardEl.animate(
    [
      { transform: 'rotateY(180deg)' },
      { transform: 'rotateY(0deg)' },
    ],
    {
      duration,
      easing: 'ease-in-out',
    },
  );

  return anim.finished.then(() => {});
}

/** Animate cards spreading out when revealed (round end) */
export function animateRevealHand(cards: Element[], staggerMs = 60): Promise<void> {
  const animations = cards.map((card, i) =>
    card.animate(
      [
        { transform: 'scale(0.5) rotateY(180deg)', opacity: 0 },
        { transform: 'scale(1) rotateY(0deg)', opacity: 1 },
      ],
      {
        duration: 400,
        delay: i * staggerMs,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'backwards',
      },
    ).finished,
  );

  return Promise.all(animations).then(() => {});
}

/** Subtle pulse animation for emphasis (e.g., score change) */
export function animatePulse(el: Element): Promise<void> {
  const anim = el.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.15)' },
      { transform: 'scale(1)' },
    ],
    {
      duration: 300,
      easing: 'ease-in-out',
    },
  );

  return anim.finished.then(() => {});
}

/** Shake animation for errors */
export function animateShake(el: Element): Promise<void> {
  const anim = el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(3px)' },
      { transform: 'translateX(0)' },
    ],
    {
      duration: 300,
      easing: 'ease-in-out',
    },
  );

  return anim.finished.then(() => {});
}

/** Fade in with upward slide */
export function animateSlideIn(el: Element, delay = 0): Promise<void> {
  const anim = el.animate(
    [
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 },
    ],
    {
      duration: 300,
      delay,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'backwards',
    },
  );

  return anim.finished.then(() => {});
}
