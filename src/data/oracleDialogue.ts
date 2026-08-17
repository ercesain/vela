import type { ReadingIntention, TarotCardId } from '@/types';

export const intentions: { id: ReadingIntention; label: string; symbol: string }[] = [
  { id: 'flort', label: 'Flört', symbol: '♥' },
  { id: 'ciddi-iliski', label: 'Ciddi İlişki', symbol: '✿' },
  { id: 'genel-enerji', label: 'Genel Enerji', symbol: '☾' },
];

export const openingMessage =
  'Enerjin bugün oldukça güçlü.\nKartlarına baktığımda özellikle ilişkiler tarafında dikkatimi çeken bir şey var.';

export const followUpMessage = 'Bunu biraz daha derinleştirmemi ister misin?';

export const cardInterpretations: Record<TarotCardId, string> = {
  lovers:
    'Bu kart güçlü bir bağ ve karşılıklı çekim gösteriyor. Ama burada yalnızca hislerden değil, bir seçimden de bahsediyoruz.',
  moon: 'Bu kart, yüzeyin altında akan gizli duyguları işaret ediyor. Sezgilerine güvenmenin tam zamanı — her şey göründüğü gibi değil.',
  star: 'Bu kart umut ve yenilenme getiriyor. Zorlu bir dönemin ardından net bir yöne doğru ilerliyorsun.',
};

const mockedReplies = [
  'Evrenin sana fısıldadıklarını duyuyorum... Sabırlı ol, cevaplar zamanla netleşecek.',
  'Bu konuda kalbinin sesini dinlemelisin. Kartlar sana yol gösteriyor, kararı sen vereceksin.',
  'Enerjinde bir değişim hissediyorum. Bu döngüyü kucaklamaya hazır ol.',
  'Sezgilerin seni yanıltmıyor. Bu duyguya güvenebilirsin.',
];

export const getMockedOracleReply = () =>
  mockedReplies[Math.floor(Math.random() * mockedReplies.length)];
