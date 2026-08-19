import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

const ZODIAC: ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

const TARGETS = {
  sun: "10",
  mercury: "199",
  venus: "299",
  moon: "301",
  mars: "499",
  jupiter: "599",
  saturn: "699",
  uranus: "799",
  neptune: "899",
  pluto: "999",
} as const;

const SKY_CACHE_ID = "global";

const CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function getAgeMs(iso?: string | null) {
  if (!iso) return Number.POSITIVE_INFINITY;

  const value = new Date(iso).getTime();
  if (Number.isNaN(value)) return Number.POSITIVE_INFINITY;

  return Date.now() - value;
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function longitudeToZodiac(longitude: number) {
  const normalized = normalizeDegrees(longitude);
  const signIndex = Math.floor(normalized / 30);

  return {
    sign: ZODIAC[signIndex],
    degree: Number((normalized % 30).toFixed(3)),
    longitude: Number(normalized.toFixed(6)),
  };
}

function signedAngularDelta(from: number, to: number) {
  let delta = normalizeDegrees(to) - normalizeDegrees(from);

  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  return delta;
}

function moonPhaseFromElongation(sunLongitude: number, moonLongitude: number) {
  const angle = normalizeDegrees(moonLongitude - sunLongitude);

  if (angle < 22.5 || angle >= 337.5) return "new_moon";
  if (angle < 67.5) return "waxing_crescent";
  if (angle < 112.5) return "first_quarter";
  if (angle < 157.5) return "waxing_gibbous";
  if (angle < 202.5) return "full_moon";
  if (angle < 247.5) return "waning_gibbous";
  if (angle < 292.5) return "last_quarter";
  return "waning_crescent";
}

function formatHorizonsTime(date: Date) {
  // Horizons accepts calendar dates; keep the query explicitly in UTC.
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

async function fetchWithRetry(
  url: string,
  attempts = 3,
  baseDelayMs = 700,
) {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url);
    lastStatus = response.status;

    if (response.ok) {
      return response;
    }

    const retryable = response.status === 429 || response.status >= 500;

    if (!retryable || attempt === attempts) {
      throw new Error(`JPL Horizons HTTP ${response.status}`);
    }

    await new Promise((resolve) =>
      setTimeout(resolve, baseDelayMs * attempt),
    );
  }

  throw new Error(`JPL Horizons HTTP ${lastStatus || 503}`);
}

async function fetchEclipticLongitude(targetId: string, at: Date) {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${targetId}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    TLIST: `'${formatHorizonsTime(at)}'`,
    TLIST_TYPE: "'CAL'",
    TIME_TYPE: "'UT'",
    QUANTITIES: "'31'",
    CSV_FORMAT: "'YES'",
    ANG_FORMAT: "'DEG'",
  });

  const response = await fetchWithRetry(
    `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`,
  );

  const payload = await response.json() as {
    result?: string;
    error?: string;
  };

  if (payload.error) {
    throw new Error(`JPL Horizons: ${payload.error}`);
  }

  const result = payload.result ?? "";
  const start = result.indexOf("$$SOE");
  const end = result.indexOf("$$EOE");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JPL Horizons ephemeris row not found");
  }

  const table = result.slice(start + 5, end);
  const row = table
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!row) {
    throw new Error("JPL Horizons returned an empty ephemeris");
  }

  const numericValues = row
    .split(",")
    .map((value) => Number.parseFloat(value.trim()))
    .filter((value) => Number.isFinite(value));

  if (numericValues.length < 2) {
    throw new Error(`Could not parse JPL Horizons row: ${row}`);
  }

  // Quantity #31 is ObsEcLon, ObsEcLat. They are the final numeric
  // quantities in the requested CSV row.
  const longitude = numericValues[numericValues.length - 2];

  return normalizeDegrees(longitude);
}

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (req, ctx) => {
      try {
        const url = new URL(req.url);
        const requestedAt = url.searchParams.get("at");
        const forceRefresh =
          url.searchParams.get("refresh") === "1" ||
          url.searchParams.get("refresh") === "true";
        const at = requestedAt ? new Date(requestedAt) : new Date();

        if (Number.isNaN(at.getTime())) {
          return Response.json(
            { error: "Invalid `at` date. Use an ISO-8601 value." },
            { status: 400 },
          );
        }

        // Normal app traffic is cache-first. JPL is only touched when:
        // - there is no cache yet,
        // - cache is older than two hours,
        // - or refresh=1 is explicitly requested.
        if (!forceRefresh && !requestedAt) {
          const { data: cached, error: cacheReadError } =
            await ctx.supabaseAdmin
              .from("current_sky_cache")
              .select("payload, observed_at, updated_at")
              .eq("id", SKY_CACHE_ID)
              .maybeSingle();

          if (cacheReadError) {
            console.warn(
              "[VELA current-sky] cache-first read failed",
              cacheReadError,
            );
          } else if (cached?.payload) {
            const ageMs = getAgeMs(cached.updated_at);

            if (ageMs <= CACHE_MAX_AGE_MS) {
              return Response.json({
                ...cached.payload,
                cache: {
                  hit: true,
                  stale: false,
                  ageSeconds: Math.max(0, Math.round(ageMs / 1000)),
                  observedAt: cached.observed_at,
                  updatedAt: cached.updated_at,
                },
              });
            }
          }
        }

        const mercuryLater = new Date(at.getTime() + 6 * 60 * 60 * 1000);

        // JPL SSD API fair-use policy requires ONE request at a time.
        // Do not parallelize these calls with Promise.all.
        const sunLongitude = await fetchEclipticLongitude(TARGETS.sun, at);
        const mercuryLongitude = await fetchEclipticLongitude(TARGETS.mercury, at);
        const mercuryLongitudeLater = await fetchEclipticLongitude(
          TARGETS.mercury,
          mercuryLater,
        );
        const venusLongitude = await fetchEclipticLongitude(TARGETS.venus, at);
        const moonLongitude = await fetchEclipticLongitude(TARGETS.moon, at);
        const marsLongitude = await fetchEclipticLongitude(TARGETS.mars, at);
        const jupiterLongitude = await fetchEclipticLongitude(TARGETS.jupiter, at);
        const saturnLongitude = await fetchEclipticLongitude(TARGETS.saturn, at);
        const uranusLongitude = await fetchEclipticLongitude(TARGETS.uranus, at);
        const neptuneLongitude = await fetchEclipticLongitude(TARGETS.neptune, at);
        const plutoLongitude = await fetchEclipticLongitude(TARGETS.pluto, at);

        const mercuryMotion = signedAngularDelta(
          mercuryLongitude,
          mercuryLongitudeLater,
        );

        const payload = {
          source: "JPL Horizons",
          generatedAt: new Date().toISOString(),
          observedAt: at.toISOString(),
          zodiac: "tropical",
          planets: {
            sun: {
              ...longitudeToZodiac(sunLongitude),
              retrograde: false,
            },
            mercury: {
              ...longitudeToZodiac(mercuryLongitude),
              retrograde: mercuryMotion < 0,
            },
            venus: {
              ...longitudeToZodiac(venusLongitude),
            },
            moon: {
              ...longitudeToZodiac(moonLongitude),
            },
            mars: {
              ...longitudeToZodiac(marsLongitude),
            },
            jupiter: {
              ...longitudeToZodiac(jupiterLongitude),
            },
            saturn: {
              ...longitudeToZodiac(saturnLongitude),
            },
            uranus: {
              ...longitudeToZodiac(uranusLongitude),
            },
            neptune: {
              ...longitudeToZodiac(neptuneLongitude),
            },
            pluto: {
              ...longitudeToZodiac(plutoLongitude),
            },
          },
          moonPhase: moonPhaseFromElongation(
            sunLongitude,
            moonLongitude,
          ),
        };

        const { error: cacheWriteError } = await ctx.supabaseAdmin
          .from("current_sky_cache")
          .upsert(
            {
              id: SKY_CACHE_ID,
              payload,
              observed_at: payload.observedAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );

        if (cacheWriteError) {
          console.warn("[VELA current-sky] cache write failed", cacheWriteError);
        }

        return Response.json({
          ...payload,
          cache: {
            hit: false,
            stale: false,
            refreshed: true,
          },
        });
      } catch (error) {
        console.error("[VELA current-sky]", error);

        const message =
          error instanceof Error ? error.message : "Unknown error";

        const retryable =
          message.includes("HTTP 429") ||
          message.includes("HTTP 500") ||
          message.includes("HTTP 502") ||
          message.includes("HTTP 503") ||
          message.includes("HTTP 504");

        const { data: cached, error: cacheReadError } =
          await ctx.supabaseAdmin
            .from("current_sky_cache")
            .select("payload, observed_at, updated_at")
            .eq("id", SKY_CACHE_ID)
            .maybeSingle();

        if (!cacheReadError && cached?.payload) {
          return Response.json({
            ...cached.payload,
            cache: {
              hit: true,
              stale: true,
              observedAt: cached.observed_at,
              updatedAt: cached.updated_at,
              fallbackReason: message,
            },
          });
        }

        if (cacheReadError) {
          console.warn("[VELA current-sky] cache read failed", cacheReadError);
        }

        return Response.json(
          {
            error: "current_sky_unavailable",
            message,
            retryable,
            retryAfterSeconds: retryable ? 30 : undefined,
          },
          {
            status: retryable ? 503 : 502,
            headers: retryable
              ? { "Retry-After": "30" }
              : undefined,
          },
        );
      }
    },
  ),
};
