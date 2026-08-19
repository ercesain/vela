import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, radius, spacing, typeScale } from '@/theme';
import type { OracleProfile } from '@/types';
import type { OracleWorldConfig } from '@/data/oracleWorlds';
import { useAstroProfile } from '@/profile';
import {
  createAstroContext,
  createNatalChart,
  velaCurrentSkyProvider,
  type AstroContext,
  type NatalChartProvider,
  type ReadingTopic,
} from '@/astrology';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ORACLE_READING_URL =
  'https://sdcyuumfbqijxsewftkp.supabase.co/functions/v1/oracle-reading';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_LQ7hC_WSow7T09CAlSHV9A_25oG7QBu';

const lunaWorldHero = require('../../assets/characters/luna-world-hero-clean.png');

const lunaCardBacks = [
  require('../../assets/cards/luna-card-back.png'),
  require('../../assets/cards/luna-card-back-1.png'),
  require('../../assets/cards/luna-card-back-2.png'),
];

const LUNA_TAROT_FRONTS = [
  {
    source: require('../../assets/tarot/lovers.png'),
    name: 'AŞIKLAR',
    meaning:
      'Kalbin burada seçim, çekim ve karşılıklılık temasını açıyor. Luna sana yalnızca hissettiğini değil, kimi ve neyi gerçekten seçtiğini de soruyor.',
  },
  {
    source: require('../../assets/tarot/star.png'),
    name: 'YILDIZ',
    meaning:
      'Bu bağın içinde umut, açıklık ve iyileşme ihtimali var. Luna acele bir cevap yerine, aranızdaki enerjinin sana neyi yeniden hatırlattığına bakmanı istiyor.',
  },
  {
    source: require('../../assets/tarot/moon.png'),
    name: 'AY',
    meaning:
      'Her şey henüz görünür değil. Luna burada sezgini öne çıkarıyor: korkuyla sezgiyi birbirinden ayırdığında, gizli kalan gerçek daha netleşecek.',
  },
] as const;

const CARD_CHOICE_LABELS = ['AŞK', 'BAĞLANTI', 'KENDİM'] as const;

const CARD_LAYOUT = [
  { left: '18%', top: '72%', rotate: -7 },
  { left: '40%', top: '71%', rotate: 0 },
  { left: '62%', top: '72%', rotate: 7 },
] as const;

type WarmTopic = 'love' | 'connection' | 'self';

const CHOICE_TOPIC_MAP: WarmTopic[] = ['love', 'connection', 'self'];
const CARD_CENTER_SHIFT = SCREEN_WIDTH * 0.22;

const ASTRO_WORDS: Record<string, string> = {
  sun: 'Güneş',
  moon: 'Ay',
  mercury: 'Merkür',
  venus: 'Venüs',
  mars: 'Mars',
  jupiter: 'Jüpiter',
  saturn: 'Satürn',
  uranus: 'Uranüs',
  neptune: 'Neptün',
  pluto: 'Plüton',
};

const ASPECT_REASON: Record<string, string> = {
  conjunction: 'aynı temayı güçlü biçimde vurguluyor',
  opposition: 'iki farklı ihtiyacı karşı karşıya getiriyor',
  square: 'dikkat isteyen bir gerilimi görünür kılıyor',
  trine: 'daha doğal ve akıcı bir alan açıyor',
  sextile: 'kullanabileceğin destekleyici bir alan açıyor',
};

function buildWhyNowText(title?: string) {
  if (!title) return null;

  const parts = title.trim().split(/\s+/);

  if (parts.length === 4 && parts[2] === 'natal') {
    const transitPlanet = ASTRO_WORDS[parts[0]] ?? parts[0];
    const natalPlanet = ASTRO_WORDS[parts[3]] ?? parts[3];
    const reason =
      ASPECT_REASON[parts[1]] ?? 'bugün daha belirgin bir tema oluşturuyor';

    return `${transitPlanet} ile doğum haritandaki ${natalPlanet} arasındaki temas ${reason}.`;
  }

  if (parts.length === 2 && parts[0].toLowerCase() === 'ay') {
    return 'Ay’ın bugünkü konumu duygusal tonu biraz daha görünür hale getiriyor.';
  }

  return null;
}

interface OracleWorldScreenProps {
  oracle: OracleProfile;
  config: OracleWorldConfig;
  natalChartProvider: NatalChartProvider;
}

function TableCard({
  index,
  source,
  selectedIndex,
  progress,
  onPress,
}: {
  index: number;
  source: number;
  selectedIndex: number | null;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const isSelected = selectedIndex === index;
  const anotherSelected = selectedIndex !== null && !isSelected;
  const layout = CARD_LAYOUT[index];
  const tarot = LUNA_TAROT_FRONTS[index];

  const shellStyle = useAnimatedStyle(() => {
    if (!isSelected) {
      return {
        opacity: anotherSelected
          ? interpolate(
              progress.value,
              [0, 0.18, 0.42],
              [1, 0.18, 0],
              Extrapolation.CLAMP,
            )
          : 1,
        transform: [
          { rotateZ: `${layout.rotate}deg` },
          {
            scale: anotherSelected
              ? interpolate(
                  progress.value,
                  [0, 0.26],
                  [1, 0.92],
                  Extrapolation.CLAMP,
                )
              : 1,
          },
        ],
      };
    }

    const xTarget =
      index === 0 ? CARD_CENTER_SHIFT : index === 2 ? -CARD_CENTER_SHIFT : 0;

    return {
      opacity: interpolate(
        progress.value,
        [0, 0.84, 0.98, 1],
        [1, 1, 0.15, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: interpolate(
            progress.value,
            [0, 0.36],
            [0, xTarget],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            progress.value,
            [0, 0.36, 0.82, 1],
            [0, -220, -220, -240],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            progress.value,
            [0, 0.36, 0.82, 1],
            [1, 2.18, 2.18, 2.05],
            Extrapolation.CLAMP,
          ),
        },
        {
          rotateZ: `${interpolate(
            progress.value,
            [0, 0.36],
            [layout.rotate, 0],
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
    };
  }, [isSelected, anotherSelected, index]);

  const backFaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.50, 0.57],
      [1, 1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      { perspective: 1400 },
      {
        rotateY: `${interpolate(
          progress.value,
          [0.40, 0.70],
          [0, 180],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  const frontFaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.55, 0.62],
      [0, 0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      { perspective: 1400 },
      {
        rotateY: `${interpolate(
          progress.value,
          [0.40, 0.70],
          [-180, 0],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity:
      selectedIndex === null
        ? 1
        : interpolate(
            progress.value,
            [0, 0.14],
            [1, 0],
            Extrapolation.CLAMP,
          ),
  }));

  return (
    <Animated.View
      style={[
        styles.tableCardShell,
        {
          left: layout.left,
          top: layout.top,
          zIndex: isSelected ? 80 : index + 5,
        },
        shellStyle,
      ]}
    >
      <Pressable
        disabled={selectedIndex !== null}
        onPress={onPress}
        style={styles.cardPressable}
      >
        <View style={styles.flipper}>
          <Animated.View style={[styles.cardSide, backFaceStyle]}>
            <Image source={source} style={styles.cardImage} resizeMode="contain" />
          </Animated.View>

          <Animated.View
            style={[styles.cardSide, styles.cardFrontSide, frontFaceStyle]}
          >
            <Image
              source={tarot.source}
              style={styles.cardFrontImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.Text style={[styles.choiceLabel, labelStyle]}>
        {CARD_CHOICE_LABELS[index]}
      </Animated.Text>
    </Animated.View>
  );
}

export function OracleWorldScreen({
  oracle,
  config,
  natalChartProvider,
}: OracleWorldScreenProps) {
  const { profile } = useAstroProfile();

  const [assetsReady, setAssetsReady] = useState(false);
  const [loadedAssetCount, setLoadedAssetCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealComplete, setRevealComplete] = useState(false);

  const [astroContext, setAstroContext] = useState<AstroContext | null>(null);
  const [astroLoading, setAstroLoading] = useState(false);

  const [oracleReading, setOracleReading] = useState<string | null>(null);
  const [oracleReadingLoading, setOracleReadingLoading] = useState(false);
  const [oracleReadingError, setOracleReadingError] = useState<string | null>(
    null,
  );

  const reveal = useSharedValue(0);
  const skyDrift = useSharedValue(0);

  const preparedAstroRef = useRef<
    Partial<Record<WarmTopic, AstroContext>>
  >({});
  const astroWarmupPromiseRef = useRef<
    Promise<Partial<Record<WarmTopic, AstroContext>>> | null
  >(null);

  const heroSource = oracle.id === 'luna' ? lunaWorldHero : oracle.artwork;
  const selectedTarot =
    selectedIndex !== null ? LUNA_TAROT_FRONTS[selectedIndex] : null;

  const preloadSources = [
    heroSource,
    ...lunaCardBacks,
    ...LUNA_TAROT_FRONTS.map((card) => card.source),
  ];

  useEffect(() => {
    if (loadedAssetCount >= preloadSources.length) {
      setAssetsReady(true);
    }
  }, [loadedAssetCount, preloadSources.length]);

  useEffect(() => {
    skyDrift.value = withRepeat(
      withTiming(1, {
        duration: 10000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [skyDrift]);

  const driftingStarsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      skyDrift.value,
      [0, 1],
      [0.36, 0.72],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          skyDrift.value,
          [0, 1],
          [0, -7],
          Extrapolation.CLAMP,
        ),
      },
      {
        translateX: interpolate(
          skyDrift.value,
          [0, 1],
          [0, 4],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  useEffect(() => {
    if (oracle.id !== 'luna' || !profile) {
      preparedAstroRef.current = {};
      astroWarmupPromiseRef.current = null;
      return;
    }

    let cancelled = false;

    const warmupPromise = (async () => {
      try {
        const natal = await createNatalChart({
          provider: natalChartProvider,
          birthProfile: profile,
        });

        const contexts = await Promise.all(
          CHOICE_TOPIC_MAP.map(async (topic) => {
            const context = await createAstroContext({
              provider: velaCurrentSkyProvider,
              birthProfile: profile,
              natal,
              topic,
            });

            return [topic, context] as const;
          }),
        );

        const prepared = Object.fromEntries(contexts) as Partial<
          Record<WarmTopic, AstroContext>
        >;

        if (!cancelled) {
          preparedAstroRef.current = prepared;
        }

        return prepared;
      } catch (error) {
        console.warn('[VELA] Astro warmup could not be completed.', error);
        return {};
      }
    })();

    astroWarmupPromiseRef.current = warmupPromise;

    return () => {
      cancelled = true;
    };
  }, [oracle.id, profile, natalChartProvider]);

  /*
   * IMPORTANT:
   * Data work starts the instant the user taps a card.
   * It runs in parallel with the 1.1s reveal animation instead of waiting for it.
   */
  useEffect(() => {
    let cancelled = false;

    const prepareReading = async () => {
      if (oracle.id !== 'luna' || selectedIndex === null) {
        return;
      }

      const topic = CHOICE_TOPIC_MAP[selectedIndex] ?? 'general';
      const tarot = LUNA_TAROT_FRONTS[selectedIndex];

      setOracleReading(null);
      setOracleReadingError(null);
      setOracleReadingLoading(true);

      let readingSignals: Array<{
        title: string;
        detail?: string;
        score: number;
      }> = [];

      if (profile) {
        setAstroLoading(true);

        try {
          let nextContext = preparedAstroRef.current[topic];

          if (!nextContext && astroWarmupPromiseRef.current) {
            const warmed = await astroWarmupPromiseRef.current;
            nextContext = warmed[topic];
          }

          if (!nextContext) {
            const natal = await createNatalChart({
              provider: natalChartProvider,
              birthProfile: profile,
            });

            nextContext = await createAstroContext({
              provider: velaCurrentSkyProvider,
              birthProfile: profile,
              natal,
              topic,
            });

            preparedAstroRef.current[topic] = nextContext;
          }

          readingSignals = nextContext.relevantSignals.map((signal) => ({
            title: signal.title,
            detail: signal.detail,
            score: signal.score,
          }));

          if (!cancelled) {
            setAstroContext(nextContext);
          }
        } catch (error) {
          console.warn('[VELA] Astro context could not be created.', error);

          if (!cancelled) {
            setAstroContext(null);
          }
        } finally {
          if (!cancelled) {
            setAstroLoading(false);
          }
        }
      } else if (!cancelled) {
        setAstroContext(null);
        setAstroLoading(false);
      }

      try {
        const response = await fetch(ORACLE_READING_URL, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oracle: 'luna',
            topic,
            tarot: {
              name: tarot.name,
              meaning: tarot.meaning,
            },
            astro: {
              signals: readingSignals,
            },
          }),
        });

        if (!response.ok) {
          const body = await response.text();

          throw new Error(
            `VELA oracle-reading HTTP ${response.status}: ${body}`,
          );
        }

        const payload = (await response.json()) as {
          reading?: string;
        };

        if (!payload.reading) {
          throw new Error('Luna yorumu boş döndü.');
        }

        if (!cancelled) {
          setOracleReading(payload.reading);
        }
      } catch (error) {
        console.warn('[VELA] Oracle reading could not be created.', error);

        if (!cancelled) {
          setOracleReadingError(
            'Luna şu an yorumunu tamamlayamadı. Kartın temel mesajını gösteriyorum.',
          );
        }
      } finally {
        if (!cancelled) {
          setOracleReadingLoading(false);
        }
      }
    };

    prepareReading();

    return () => {
      cancelled = true;
    };
  }, [oracle.id, selectedIndex, profile, natalChartProvider]);

  const handleCardPress = (index: number) => {
    if (selectedIndex !== null) return;
    if (!config.choices[index]) return;

    Haptics.selectionAsync();

    setSelectedIndex(index);
    setRevealComplete(false);
    setAstroContext(null);
    setOracleReading(null);
    setOracleReadingError(null);

    reveal.value = 0;
    reveal.value = withTiming(1, {
      duration: 850,
      easing: Easing.inOut(Easing.cubic),
    });

    setTimeout(() => {
      setRevealComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 850);
  };

  const handleReset = () => {
    reveal.value = 0;
    setSelectedIndex(null);
    setRevealComplete(false);
    setAstroContext(null);
    setAstroLoading(false);
    setOracleReading(null);
    setOracleReadingLoading(false);
    setOracleReadingError(null);
  };

  const whyNowText = buildWhyNowText(
    astroContext?.relevantSignals[0]?.title,
  );

  const finalReading =
    oracleReading ?? selectedTarot?.meaning ?? '';

  const isReadingMode =
    selectedIndex !== null && revealComplete && selectedTarot !== null;

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.preloadRack}>
        {preloadSources.map((source, index) => (
          <Image
            key={`vela-preload-${index}`}
            source={source}
            style={styles.preloadImage}
            onLoadEnd={() => {
              setLoadedAssetCount((count) =>
                Math.min(count + 1, preloadSources.length),
              );
            }}
          />
        ))}
      </View>

      <Image
        source={heroSource}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={26}
      />

      <LinearGradient
        colors={[
          'rgba(4,2,8,0.78)',
          'rgba(18,6,29,0.55)',
          'rgba(4,2,8,0.94)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, driftingStarsStyle]}
      >
        <Text style={[styles.worldStar, { left: '7%', top: '18%' }]}>✦</Text>
        <Text style={[styles.worldStarSmall, { right: '9%', top: '27%' }]}>·</Text>
        <Text style={[styles.worldStar, { right: '6%', top: '42%' }]}>⋆</Text>
        <Text style={[styles.worldStarSmall, { left: '10%', top: '54%' }]}>✧</Text>
        <Text style={[styles.worldStarSmall, { left: '20%', top: '33%' }]}>·</Text>
        <Text style={[styles.worldStar, { right: '20%', top: '16%' }]}>✧</Text>
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={14}
            style={styles.backButton}
          >
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>

          <Text style={styles.headerWordmark}>VELA</Text>

          <View style={styles.headerSpacer} />
        </View>

        {!isReadingMode ? (
          <View style={styles.selectionScene}>
            <View style={styles.selectionHero}>
              <Image
                source={heroSource}
                style={styles.selectionHeroImage}
                resizeMode="cover"
              />

              <LinearGradient
                colors={[
                  'rgba(4,2,8,0.36)',
                  'transparent',
                  'rgba(4,2,8,0.94)',
                ]}
                locations={[0, 0.58, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              <LinearGradient
                colors={[
                  'rgba(4,2,8,0.88)',
                  'transparent',
                  'rgba(4,2,8,0.88)',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {oracle.id === 'luna' && assetsReady
                ? config.choices.slice(0, 3).map((choice, index) => (
                    <TableCard
                      key={choice.id}
                      index={index}
                      source={lunaCardBacks[index]}
                      selectedIndex={selectedIndex}
                      progress={reveal}
                      onPress={() => handleCardPress(index)}
                    />
                  ))
                : null}
            </View>

            <View style={styles.selectionCopy}>
              <Text style={styles.title}>{config.title}</Text>

              <Text style={styles.subtitle}>
                {!assetsReady
                  ? 'Luna’nın dünyası hazırlanıyor…'
                  : selectedIndex !== null
                    ? 'Kart sana açılıyor…'
                    : 'Önündeki üç karttan birini seç.'}
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.readingScroll}
            contentContainerStyle={styles.readingContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.readingHero}>
              <Image
                source={heroSource}
                style={styles.readingHeroImage}
                resizeMode="cover"
              />

              <LinearGradient
                colors={[
                  'rgba(4,2,8,0.08)',
                  'rgba(4,2,8,0.30)',
                  'rgba(4,2,8,1)',
                ]}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={styles.readingBody}>
              <Text style={styles.readingEyebrow}>LUNA’NIN YORUMU</Text>
              <Text style={styles.readingCardName}>{selectedTarot.name}</Text>

              {oracleReadingLoading || astroLoading ? (
                <View style={styles.loadingBlock}>
                  <Text style={styles.loadingGlyph}>✦</Text>
                  <Text style={styles.readingLoading}>
                    Luna kartını ve gökyüzünü birlikte yorumluyor…
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.readingText}>{finalReading}</Text>

                  {oracleReadingError ? (
                    <Text style={styles.readingError}>
                      {oracleReadingError}
                    </Text>
                  ) : null}

                  {whyNowText ? (
                    <View style={styles.whyNowPanel}>
                      <Text style={styles.whyNowEyebrow}>✦ NEDEN ŞİMDİ?</Text>
                      <Text style={styles.whyNowText}>{whyNowText}</Text>
                    </View>
                  ) : null}
                </>
              )}

              <Pressable onPress={handleReset} style={styles.resetButton}>
                <Text style={styles.resetText}>BAŞKA BİR KART SEÇ</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  preloadRack: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },

  preloadImage: {
    width: 1,
    height: 1,
  },

  safeArea: {
    flex: 1,
  },

  header: {
    height: 58,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 300,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,228,195,0.28)',
    backgroundColor: 'rgba(6,3,10,0.68)',
  },

  backGlyph: {
    color: colors.textPrimary,
    fontSize: 35,
    lineHeight: 37,
    marginTop: -3,
  },

  headerWordmark: {
    ...typeScale.label,
    color: colors.gold,
    letterSpacing: 3,
  },

  headerSpacer: {
    width: 42,
  },

  selectionScene: {
    flex: 1,
  },

  selectionHero: {
    flex: 1,
    width: SCREEN_WIDTH,
    position: 'relative',
    overflow: 'visible',
  },

  selectionHeroImage: {
    width: '100%',
    height: '100%',
  },

  selectionCopy: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },

  title: {
    ...typeScale.displayLarge,
    color: colors.textPrimary,
    letterSpacing: 3,
  },

  subtitle: {
    ...typeScale.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },

  tableCardShell: {
    position: 'absolute',
    width: '20%',
    aspectRatio: 0.68,
  },

  choiceLabel: {
    position: 'absolute',
    top: '108%',
    left: -18,
    right: -18,
    textAlign: 'center',
    ...typeScale.caption,
    color: 'rgba(255,232,204,0.86)',
    fontSize: 10,
    letterSpacing: 1.6,
  },

  cardPressable: {
    flex: 1,
  },

  flipper: {
    flex: 1,
  },

  cardSide: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },

  cardFrontSide: {
    borderWidth: 1,
    borderColor: 'rgba(235,196,120,0.72)',
    backgroundColor: '#09050E',
  },

  cardImage: {
    width: '100%',
    height: '100%',
  },

  cardFrontImage: {
    width: '100%',
    height: '100%',
  },

  readingScroll: {
    flex: 1,
  },

  readingContent: {
    paddingBottom: spacing.xl,
  },

  readingHero: {
    width: SCREEN_WIDTH,
    height: 330,
    overflow: 'hidden',
  },

  readingHeroImage: {
    width: '100%',
    height: '100%',
  },

  readingBody: {
    marginTop: -44,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },

  readingEyebrow: {
    ...typeScale.caption,
    color: colors.gold,
    letterSpacing: 2,
  },

  readingCardName: {
    ...typeScale.displaySmall,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },

  readingText: {
    ...typeScale.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },

  loadingBlock: {
    minHeight: 112,
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingGlyph: {
    color: colors.gold,
    fontSize: 18,
    marginBottom: spacing.xs,
  },

  readingLoading: {
    ...typeScale.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },

  readingError: {
    ...typeScale.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    opacity: 0.72,
  },

  whyNowPanel: {
    width: '100%',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,220,180,0.20)',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  whyNowEyebrow: {
    ...typeScale.caption,
    color: colors.gold,
    letterSpacing: 1.5,
  },

  whyNowText: {
    ...typeScale.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 22,
  },

  resetButton: {
    marginTop: spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  resetText: {
    ...typeScale.caption,
    color: colors.textPrimary,
    letterSpacing: 1.3,
  },

  worldStar: {
    position: 'absolute',
    color: 'rgba(255,230,190,0.58)',
    fontSize: 18,
  },

  worldStarSmall: {
    position: 'absolute',
    color: 'rgba(245,28,146,0.46)',
    fontSize: 20,
  },
});
