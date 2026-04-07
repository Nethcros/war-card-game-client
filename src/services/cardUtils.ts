/**
 * Card ID layout (matches spec):
 *   0-12  = Suit 0 (Spades)    → values 2-14
 *   13-25 = Suit 1 (Hearts)    → values 2-14
 *   26-38 = Suit 2 (Diamonds)  → values 2-14
 *   39-51 = Suit 3 (Clubs)     → values 2-14
 *
 * This replaces the spec's key-value lookup with modular arithmetic.
 * Same output, no storage needed.
 */

export function getCardValue(cardId: number): number {
  return (cardId % 13) + 2;
}

export function getCardSuit(cardId: number): number {
  return Math.floor(cardId / 13);
}

export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'];

export function getValueDisplay(value: number): string {
  if (value <= 10) return String(value);
  const faceCards: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  return faceCards[value] || String(value);
}

/** e.g. "A♠", "10♥", "K♦" */
export function getCardDisplay(cardId: number): string {
  return `${getValueDisplay(getCardValue(cardId))}${SUIT_SYMBOLS[getCardSuit(cardId)]}`;
}

/** Fisher-Yates shuffle — returns array of Card(id)s 0-51 in random order */
export function shuffleDeck(): number[] {
  const deck: number[] = Array.from({ length: 52 }, (_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}