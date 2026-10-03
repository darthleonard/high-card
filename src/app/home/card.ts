export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';

export interface Card {
  value: number; // 2..14 (14 = Ace)
  image: number; // 1..52, or 0 for unrevealed / back of card
  suit?: Suit;
  suitSymbol?: string; // ♣, ♦, ♥, ♠
  suitName?: string; // Clubs, Diamonds, Hearts, Spades
  rankName?: string; // 2..10, Jack, Queen, King, Ace
  displayName?: string; // e.g. "Ace of Spades"
  suitValue?: number; // 1 (Clubs), 2 (Diamonds), 3 (Hearts), 4 (Spades)
  isRed?: boolean;
}

export interface Player {
  playerName: string;
  card: Card;
  rank?: number;
  isWinner?: boolean;
  isFlipping?: boolean;
}

/**
 * Creates standard 52-card poker deck mapping
 * 1-13: Clubs, 14-26: Diamonds, 27-39: Hearts, 40-52: Spades
 * In each suit: Ace (value 14), 2..10 (values 2..10), Jack (11), Queen (12), King (13)
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: { type: Suit; name: string; symbol: string; suitValue: number; isRed: boolean }[] = [
    { type: 'clubs', name: 'Clubs', symbol: '♣', suitValue: 1, isRed: false },
    { type: 'diamonds', name: 'Diamonds', symbol: '♦', suitValue: 2, isRed: true },
    { type: 'hearts', name: 'Hearts', symbol: '♥', suitValue: 3, isRed: true },
    { type: 'spades', name: 'Spades', symbol: '♠', suitValue: 4, isRed: false },
  ];

  let value = 14;
  for (let i = 1; i <= 52; i++) {
    const suitIdx = Math.floor((i - 1) / 13);
    const suit = suits[suitIdx];
    const rankNames: Record<number, string> = {
      14: 'Ace',
      11: 'Jack',
      12: 'Queen',
      13: 'King',
    };
    const rankName = rankNames[value] || value.toString();

    deck.push({
      value,
      image: i,
      suit: suit.type,
      suitSymbol: suit.symbol,
      suitName: suit.name,
      rankName,
      displayName: `${rankName} of ${suit.name}`,
      suitValue: suit.suitValue,
      isRed: suit.isRed,
    });

    value = value === 14 ? 2 : value + 1;
  }

  return deck;
}

export const UNREVEALED_CARD: Card = {
  value: 0,
  image: 0,
  rankName: '?',
  displayName: 'Mystery Card',
  isRed: false,
};
