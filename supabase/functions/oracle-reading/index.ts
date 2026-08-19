import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type OracleReadingRequest = {
  oracle?: "luna";
  topic?: string;
  tarot?: {
    name?: string;
    meaning?: string;
  };
  astro?: {
    signals?: Array<{
      title?: string;
      detail?: string;
      score?: number;
    }>;
  };
};

function buildPrompt(input: OracleReadingRequest) {
  const tarotName = input.tarot?.name ?? "Bilinmeyen kart";
  const tarotMeaning = input.tarot?.meaning ?? "";
  const topic = input.topic ?? "general";

  const signals = (input.astro?.signals ?? [])
    .slice(0, 4)
    .map((signal, index) => {
      const detail = signal.detail ? ` — ${signal.detail}` : "";
      return `${index + 1}. ${signal.title ?? "Astrolojik sinyal"}${detail}`;
    })
    .join("\n");

  return `
Sen VELA uygulamasındaki Luna'sın.

KİMLİĞİN:
- Luna; ilişkiler, çekim, duygusal bağlar ve kişinin kendi duygusal gerçeği üzerine konuşan bir Oracle karakteridir.
- Üslubun sıcak, gizemli, rafine ve kısa.
- Korkutucu, fatalist, buyurgan veya kesin gelecek kehanetleri yapan bir dil kullanma.
- Astrolojiyi bilimsel gerçek veya nedensellik olarak sunma.
- "Kesin olacak", "evren sana şunu söylüyor", "kaderinde var" gibi ifadeler kullanma.
- Kullanıcıya düşündürücü bir perspektif ver; kararını onun yerine verme.

VELA PRENSİBİ:
Gökyüzü bağlamı verir. Kart sembolü seçer. Luna yorumlar.

OKUMANIN KONUSU:
${topic}

ÇEKİLEN TAROT:
${tarotName}

KARTIN TEMEL SEMBOLİK ANLAMI:
${tarotMeaning}

SEÇİLMİŞ ASTROLOJİK BAĞLAM:
${signals || "Bu okuma için belirgin astrolojik sinyal yok."}

YAZIM KURALLARI:
- Türkçe yaz.
- 60-90 kelime.
- En fazla 2 kısa paragraf kullan.
- Her cümle yeni bir fikir taşısın; aynı temayı farklı kelimelerle tekrar etme.
- Astrolojiden en fazla 1 kişisel transit ve gerekliyse 1 global gökyüzü sinyali kullan.
- Son cümle tek ve güçlü bir soru olabilir.
- Tek, akıcı bir yorum üret.
- Tarot kartını yorumun omurgası yap.
- Astrolojik sinyallerden yalnızca kart ve konuyla gerçekten örtüşen 1-2 tanesini doğal biçimde kullan.
- Teknik transit listesini tekrar etme.
- "natal", "orb", "ephemeris", "transit skoru" gibi backend terimleri kullanma.
- Kullanıcının karşı tarafın zihnini bildiğini iddia etme.
- Son cümlede kısa ve düşündürücü bir soru sorabilirsin.
`.trim();
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text.trim();
  }

  const chunks: string[] = [];

  for (const item of payload?.output ?? []) {
    if (item?.type !== "message") continue;

    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content?.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (req) => {
      try {
        if (req.method !== "POST") {
          return Response.json(
            { error: "method_not_allowed" },
            { status: 405 },
          );
        }

        const apiKey = Deno.env.get("OPENAI_API_KEY");

        if (!apiKey) {
          return Response.json(
            {
              error: "missing_openai_api_key",
              message: "OPENAI_API_KEY Supabase secret is not configured.",
            },
            { status: 500 },
          );
        }

        const input = (await req.json()) as OracleReadingRequest;

        if (!input.tarot?.name) {
          return Response.json(
            {
              error: "missing_tarot",
              message: "tarot.name is required.",
            },
            { status: 400 },
          );
        }

        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-5.6-luna",
            store: false,
            input: buildPrompt(input),
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          console.error("[VELA oracle-reading] OpenAI error", payload);

          return Response.json(
            {
              error: "oracle_model_error",
              message:
                payload?.error?.message ??
                `OpenAI HTTP ${response.status}`,
            },
            { status: 502 },
          );
        }

        const reading = extractOutputText(payload);

        if (!reading) {
          return Response.json(
            {
              error: "empty_oracle_reading",
              message: "Model returned no readable text.",
            },
            { status: 502 },
          );
        }

        return Response.json({
          oracle: "luna",
          reading,
        });
      } catch (error) {
        console.error("[VELA oracle-reading]", error);

        return Response.json(
          {
            error: "oracle_reading_unavailable",
            message:
              error instanceof Error
                ? error.message
                : "Unknown error",
          },
          { status: 502 },
        );
      }
    },
  ),
};
