import type { TarotCardId } from './tarot';

export type ReadingIntention = 'flort' | 'ciddi-iliski' | 'genel-enerji';

export type ReadingMessageRole = 'oracle' | 'user';

export interface ReadingTextMessage {
  id: string;
  type: 'text';
  role: ReadingMessageRole;
  text: string;
  timestamp: string;
}

export interface ReadingCardMessagePayload {
  id: string;
  type: 'card';
  role: 'oracle';
  cardId: TarotCardId;
  interpretation: string;
  timestamp: string;
}

export type ReadingMessage = ReadingTextMessage | ReadingCardMessagePayload;
