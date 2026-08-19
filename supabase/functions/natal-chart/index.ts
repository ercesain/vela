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

type Planet = "sun" | "moon" | "mercury" | "venus" | "mars";

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

const TARGETS: Record<Planet, string> = {
  sun: "10",
  moon: "301",
  mercury: "199",
  venus: "299",
  mars: "499",
};

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function longitudeToZodiac(longitude: number) {
  const normalized = normalizeDegrees(longitude);
  const signIndex = Math.floor(normalized / 30);

  return {
    sign: ZODIAC[signIndex],
    degree: Number((normalized % 30).toFixed(3)),
  };
}

function formatHorizonsTime(date: Date) {
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

    if (response.ok) return response;

    const retryable = response.status === 429 || response.status >= 500;

    if (!retryable || attempt === attempts) {
      throw new Error(`HTTP ${response.status}`);
    }

    await new Promise((resolve) =>
      setTimeout(resolve, baseDelayMs * attempt),
    );
  }

  throw new Error(`HTTP ${lastStatus || 503}`);
}

async function geocodeBirthPlace(birthPlace: string) {
  const url = new URL(
    "https://geocoding-api.open-meteo.com/v1/search",
  );

  url.searchParams.set("name", birthPlace);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetchWithRetry(url.toString());
  const body = await response.json() as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      timezone: string;
      country?: string;
      admin1?: string;
    }>;
  };

  const result = body.results?.[0];

  if (!result) {
    throw new Error(`Birth place not found: ${birthPlace}`);
  }

  return result;
}

function partsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function localDateTimeToUtc(
  birthDate: string,
  birthTime: string,
  timeZone: string,
) {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime.split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    throw new Error("Invalid birth date/time.");
  }

  // Start by pretending local wall-clock is UTC, then iteratively correct
  // using the historical IANA timezone offset for that exact date.
  let guessMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 3; i += 1) {
    const guess = new Date(guessMs);
    const local = partsInTimeZone(guess, timeZone);

    const representedLocalMs = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    );

    const wantedLocalMs = Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
    );

    const correction = wantedLocalMs - representedLocalMs;

    if (Math.abs(correction) < 1000) break;

    guessMs += correction;
  }

  return new Date(guessMs);
}

async function fetchEclipticLongitude(
  targetId: string,
  at: Date,
) {
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
    throw new Error("JPL Horizons ephemeris row not found.");
  }

  const row = result
    .slice(start + 5, end)
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!row) {
    throw new Error("JPL Horizons returned an empty ephemeris.");
  }

  const numericValues = row
    .split(",")
    .map((value) => Number.parseFloat(value.trim()))
    .filter((value) => Number.isFinite(value));

  if (numericValues.length < 2) {
    throw new Error(`Could not parse JPL row: ${row}`);
  }

  return normalizeDegrees(
    numericValues[numericValues.length - 2],
  );
}

function planetPosition(
  planet: Planet,
  longitude: number,
) {
  return {
    planet,
    ...longitudeToZodiac(longitude),
  };
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

        const body = await req.json() as {
          birthDate?: string;
          birthTime?: string;
          birthPlace?: string;
          birthTimeKnown?: boolean;
          timezone?: string;
          latitude?: number;
          longitude?: number;
        };

        if (!body.birthDate || !body.birthPlace) {
          return Response.json(
            {
              error: "missing_birth_data",
              message: "birthDate and birthPlace are required.",
            },
            { status: 400 },
          );
        }

        let latitude = body.latitude;
        let longitude = body.longitude;
        let timezone = body.timezone;
        let resolvedPlace = body.birthPlace;

        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number" ||
          !timezone
        ) {
          const place = await geocodeBirthPlace(body.birthPlace);

          latitude = place.latitude;
          longitude = place.longitude;
          timezone = place.timezone;
          resolvedPlace = [
            place.name,
            place.admin1,
            place.country,
          ].filter(Boolean).join(", ");
        }

        const birthTime =
          body.birthTimeKnown && body.birthTime
            ? body.birthTime
            : "12:00";

        const birthInstant = localDateTimeToUtc(
          body.birthDate,
          birthTime,
          timezone,
        );

        // JPL fair-use: one request at a time.
        const sunLongitude = await fetchEclipticLongitude(
          TARGETS.sun,
          birthInstant,
        );
        const moonLongitude = await fetchEclipticLongitude(
          TARGETS.moon,
          birthInstant,
        );
        const mercuryLongitude = await fetchEclipticLongitude(
          TARGETS.mercury,
          birthInstant,
        );
        const venusLongitude = await fetchEclipticLongitude(
          TARGETS.venus,
          birthInstant,
        );
        const marsLongitude = await fetchEclipticLongitude(
          TARGETS.mars,
          birthInstant,
        );

        return Response.json({
          sun: planetPosition("sun", sunLongitude),
          moon: planetPosition("moon", moonLongitude),
          mercury: planetPosition("mercury", mercuryLongitude),
          venus: planetPosition("venus", venusLongitude),
          mars: planetPosition("mars", marsLongitude),

          // Metadata is intentionally extra; the mobile provider may ignore it.
          meta: {
            source: "JPL Horizons",
            zodiac: "tropical",
            birthInstantUtc: birthInstant.toISOString(),
            birthTimeKnown: Boolean(
              body.birthTimeKnown && body.birthTime,
            ),
            birthTimeUsed: birthTime,
            birthPlace: resolvedPlace,
            latitude,
            longitude,
            timezone,
            ascendantCalculated: false,
          },
        });
      } catch (error) {
        console.error("[VELA natal-chart]", error);

        return Response.json(
          {
            error: "natal_chart_unavailable",
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
