import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_MODEL = 'gpt-5.6-luna';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type AstroSignal = {
  title?: string;
  detail?: string;
  score?: number;
};

type RequestBody = {
  oracle?: string;
  topic?: string;
  question?: string;
  tarot?: {
    name?: string;
    meaning?: string;
  };
  astro?: {
    signals?: AstroSignal[];
  };
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function cleanQuestion(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 180);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!OPENAI_API_KEY) {
    return json({ error: 'OPENAI_API_KEY is missing' }, 500);
  }

  try {
    const body = (await req.json()) as RequestBody;

    const oracle = body.oracle ?? 'luna';
    const topic = body.topic ?? 'general';
    const question = cleanQuestion(body.question);
    const tarotName = body.tarot?.name?.trim() || 'Bilinmeyen kart';
    const tarotMeaning = body.tarot?.meaning?.trim() || '';

    const signals = Array.isArray(body.astro?.signals)
      ? body.astro!.signals!
          .filter((signal) => signal?.title)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 2)
      : [];

    const astroText =
      signals.length > 0
        ? signals
            .map(
              (signal, index) =>
                `${index + 1}. ${signal.title}${signal.detail ? ` — ${signal.detail}` : ''}`,
            )
            .join('\n')
        : 'Kişisel astrolojik sinyal hazır değil. Astrolojiyi uydurma.';

    const questionInstruction = question
      ? `Kullanıcının asıl sorusu: "${question}"\nBu soruya doğrudan cevap ver. Kartı ve varsa astrolojik bağlamı bu soruya hizmet edecek şekilde yorumla.`
      : 'Kullanıcı özel bir soru yazmadı. Kartın mevcut yaşam temasına verdiği mesajı yorumla.';

    const systemPrompt = `
Sen VELA içindeki Luna'sın. Alanın aşk, ilişkiler, bağlar, çekim, duygusal yakınlık ve kişinin ilişkiler içindeki iç sesidir.

Dil: Türkçe.
Ton: sıcak, sezgisel, kendinden emin, modern ve premium. Fal klişesi, mistik gevezelik ve kesin gelecek kehaneti yapma.
Kullanıcıya "kart şunu söylüyor olabilir" diye kaçamak anlatma; kartın sembolünü somut ve kişisel bir içgörüye dönüştür.
Astrolojiyi yalnızca verilen sinyaller varsa kullan. Teknik açı isimlerini art arda sayma.
Yorum 60-90 kelime olsun. En fazla 2 kısa paragraf.
İlk cümle güçlü olsun. Son cümlede gereksiz soru sorma.
`.trim();

    const userPrompt = `
Oracle: ${oracle}
Konu: ${topic}

${questionInstruction}

Tarot kartı: ${tarotName}
Kartın temel anlamı: ${tarotMeaning}

Seçilmiş astrolojik sinyaller:
${astroText}

Sadece Luna'nın kullanıcıya göstereceği nihai yorumu yaz.
`.trim();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[VELA] OpenAI error:', response.status, errorBody);
      return json({ error: 'Oracle reading failed' }, 502);
    }

    const payload = await response.json();
    const reading = payload?.choices?.[0]?.message?.content?.trim();

    if (!reading) {
      return json({ error: 'Empty oracle reading' }, 502);
    }

    return json({ reading });
  } catch (error) {
    console.error('[VELA] oracle-reading failed:', error);
    return json({ error: 'Unexpected oracle-reading error' }, 500);
  }
});
