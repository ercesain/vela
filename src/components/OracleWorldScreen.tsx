import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeInUp,
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
} from '@/astrology';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ORACLE_READING_URL =
  'https://sdcyuumfbqijxsewftkp.supabase.co/functions/v1/oracle-reading';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_LQ7hC_WSow7T09CAlSHV9A_25oG7QBu';

const lunaWorldHero = require('../../assets/characters/luna-world-hero-fast.jpg');
const lunaWorldBackground = require('../../assets/characters/luna-world-bg-fast.jpg');

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


function StaticTableCards({
  hiddenIndex,
}: {
  hiddenIndex: number | null;
}) {
  return (
    <>
      {CARD_LAYOUT.map((layout, index) => (
        <View
          key={`static-card-${index}`}
          pointerEvents="none"
          style={[
            styles.staticCardShell,
            {
              left: layout.left,
              top: layout.top,
              transform: [{ rotateZ: `${layout.rotate}deg` }],
              opacity: hiddenIndex === index ? 0 : 1,
            },
          ]}
        >
          <Image
            source={lunaCardBacks[0]}
            style={styles.cardImage}
            resizeMode="contain"
          />
          <Text style={styles.choiceLabelStatic}>{CARD_CHOICE_LABELS[index]}</Text>
        </View>
      ))}
    </>
  );
}

function TableCard({
  index,
  source,
  selectedIndex,
  progress,
  onPress,
  visibleBack = true,
}: {
  index: number;
  source: number;
  selectedIndex: number | null;
  progress: SharedValue<number>;
  onPress: () => void;
  visibleBack?: boolean;
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
      opacity: 1,
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
          <Animated.View
            style={[
              styles.cardSide,
              backFaceStyle,
              !visibleBack ? styles.invisibleBackFace : null,
            ]}
          >
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

      {visibleBack ? (
        <Animated.Text style={[styles.choiceLabel, labelStyle]}>
          {CARD_CHOICE_LABELS[index]}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
}

export function OracleWorldScreen({
  oracle,
  config,
  natalChartProvider,
}: OracleWorldScreenProps) {
  const { profile } = useAstroProfile();


  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealComplete, setRevealComplete] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');

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
   * Reading strategy:
   * The AI call must never wait several seconds for astrology.
   * If exact astro context is ready, use it. Otherwise wait max 300ms,
   * start the reading, and let astro finish in the background for "Neden şimdi?".
   */
  useEffect(() => {
    let cancelled = false;

    const prepareReading = async () => {
      if (oracle.id !== 'luna' || selectedIndex === null) {
        return;
      }

      const topic = CHOICE_TOPIC_MAP[selectedIndex];
      const tarot = LUNA_TAROT_FRONTS[selectedIndex];

      setOracleReading(null);
      setOracleReadingError(null);
      setOracleReadingLoading(true);

      let contextPromise: Promise<AstroContext | null> | null = null;

      if (profile) {
        const cachedContext = preparedAstroRef.current[topic];

        if (cachedContext) {
          setAstroContext(cachedContext);
          setAstroLoading(false);
          contextPromise = Promise.resolve(cachedContext);
        } else {
          setAstroLoading(true);

          contextPromise = (async () => {
            try {
              const natal = await createNatalChart({
                provider: natalChartProvider,
                birthProfile: profile,
              });

              const context = await createAstroContext({
                provider: velaCurrentSkyProvider,
                birthProfile: profile,
                natal,
                topic,
              });

              preparedAstroRef.current[topic] = context;

              if (!cancelled) {
                setAstroContext(context);
              }

              return context;
            } catch (error) {
              console.warn('[VELA] Astro context could not be created.', error);

              if (!cancelled) {
                setAstroContext(null);
              }

              return null;
            } finally {
              if (!cancelled) {
                setAstroLoading(false);
              }
            }
          })();
        }
      } else {
        setAstroContext(null);
        setAstroLoading(false);
      }

      let readingSignals: Array<{
        title: string;
        detail?: string;
        score: number;
      }> = [];

      if (contextPromise) {
        const fastContext = await Promise.race([
          contextPromise,
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 300);
          }),
        ]);

        if (fastContext) {
          readingSignals = fastContext.relevantSignals.map((signal) => ({
            title: signal.title,
            detail: signal.detail,
            score: signal.score,
          }));
        }
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
            question: userQuestion.trim() || undefined,
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
  }, [
    oracle.id,
    selectedIndex,
    profile,
    natalChartProvider,
    userQuestion,
  ]);

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
      duration: 950,
      easing: Easing.inOut(Easing.cubic),
    });

    setTimeout(() => {
      setRevealComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2450);
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
      <Image
        source={oracle.id === 'luna' ? lunaWorldBackground : heroSource}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
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

            {oracle.id === 'luna' && !isReadingMode ? (
              <>
                <StaticTableCards
                  hiddenIndex={selectedIndex === null ? null : selectedIndex}
                />

                {selectedIndex === null
                  ? config.choices.slice(0, 3).map((choice, index) => (
                      <TableCard
                        key={`hit-${choice.id}`}
                        index={index}
                        source={lunaCardBacks[0]}
                        selectedIndex={selectedIndex}
                        progress={reveal}
                        visibleBack={false}
                        onPress={() => handleCardPress(index)}
                      />
                    ))
                  : (
                      <TableCard
                        key={`selected-${config.choices[selectedIndex]?.id ?? selectedIndex}`}
                        index={selectedIndex}
                        source={lunaCardBacks[0]}
                        selectedIndex={selectedIndex}
                        progress={reveal}
                        onPress={() => {}}
                      />
                    )}
              </>
            ) : null}
          </View>

          {!isReadingMode ? (
            <View style={styles.selectionCopy}>
              <Text style={styles.title}>{config.title}</Text>

              {selectedIndex === null ? (
                <>
                  <View style={styles.questionPanel}>
                    <Text style={styles.questionEyebrow}>KALBİNDEKİNİ YAZ</Text>
                    <TextInput
                      value={userQuestion}
                      onChangeText={setUserQuestion}
                      placeholder="Aklındaki kişiyi, bağı ya da soruyu birkaç kelimeyle anlat…"
                      placeholderTextColor="rgba(255,232,204,0.38)"
                      style={styles.questionInput}
                      multiline
                      maxLength={180}
                      returnKeyType="done"
                      blurOnSubmit
                    />
                    <Text style={styles.questionHint}>
                      Boş bırakabilirsin; kart yine kendi mesajını açar.
                    </Text>
                  </View>

                  <Text style={styles.subtitle}>
                    Sonra önündeki üç karttan birini seç.
                  </Text>
                </>
              ) : (
                <>
                  {userQuestion.trim() ? (
                    <Text style={styles.selectedQuestion} numberOfLines={2}>
                      “{userQuestion.trim()}”
                    </Text>
                  ) : null}
                  <Text style={styles.subtitle}>Kart sana açılıyor…</Text>
                </>
              )}
            </View>
          ) : null}

          {isReadingMode && selectedTarot ? (
            <Animated.View
              entering={FadeInUp.duration(360).easing(Easing.out(Easing.cubic))}
              style={styles.readingSheet}
            >
              <ScrollView
                style={styles.readingScroll}
                contentContainerStyle={styles.readingContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.readingBody}>
                  <Text style={styles.readingEyebrow}>LUNA’NIN YORUMU</Text>

                  <View style={styles.readingCardHero}>
                    <Image
                      source={selectedTarot.source}
                      style={styles.readingCardImage}
                      resizeMode="contain"
                    />
                    <View style={styles.readingCardMeta}>
                      <Text style={styles.readingCardLabel}>AÇILAN KART</Text>
                      <Text style={styles.readingCardName}>
                        {selectedTarot.name}
                      </Text>
                    </View>
                  </View>

                  {userQuestion.trim() ? (
                    <View style={styles.readingQuestionPanel}>
                      <Text style={styles.readingQuestionLabel}>
                        KALBİNDEKİ
                      </Text>
                      <Text style={styles.readingQuestionText}>
                        {userQuestion.trim()}
                      </Text>
                    </View>
                  ) : null}

                  {oracleReadingLoading ? (
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
            </Animated.View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
    position: 'relative',
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

  questionPanel: {
    width: '100%',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,220,180,0.22)',
    backgroundColor: 'rgba(7,3,12,0.72)',
  },

  questionEyebrow: {
    ...typeScale.caption,
    color: colors.gold,
    letterSpacing: 1.6,
    marginBottom: spacing.xxs,
  },

  questionInput: {
    ...typeScale.body,
    color: colors.textPrimary,
    minHeight: 44,
    maxHeight: 78,
    paddingVertical: 7,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
  },

  questionHint: {
    ...typeScale.caption,
    color: colors.textSecondary,
    opacity: 0.58,
    marginTop: 2,
  },

  selectedQuestion: {
    ...typeScale.body,
    color: colors.textPrimary,
    textAlign: 'center',
    opacity: 0.82,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },

  staticCardShell: {
    position: 'absolute',
    width: '20%',
    aspectRatio: 0.68,
    zIndex: 4,
  },

  choiceLabelStatic: {
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

  invisibleBackFace: {
    opacity: 0,
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

  readingSheet: {
    position: 'absolute',
    zIndex: 200,
    left: spacing.md,
    right: spacing.md,
    top: '49%',
    bottom: spacing.sm,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,220,180,0.22)',
    backgroundColor: 'rgba(7,3,12,0.94)',
  },

  readingScroll: {
    flex: 1,
  },

  readingContent: {
    paddingBottom: spacing.xl,
  },

  readingBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: 'center',
  },

  readingEyebrow: {
    ...typeScale.caption,
    color: colors.gold,
    letterSpacing: 2,
  },

  readingCardHero: {
    width: '100%',
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  readingCardImage: {
    width: 72,
    height: 124,
    borderRadius: radius.sm,
  },

  readingCardMeta: {
    flex: 1,
    alignItems: 'flex-start',
  },

  readingCardLabel: {
    ...typeScale.caption,
    color: colors.gold,
    letterSpacing: 1.5,
  },

  readingCardName: {
    ...typeScale.displaySmall,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },

  readingQuestionPanel: {
    width: '100%',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,220,180,0.16)',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  readingQuestionLabel: {
    ...typeScale.caption,
    color: colors.gold,
    letterSpacing: 1.4,
  },

  readingQuestionText: {
    ...typeScale.body,
    color: colors.textPrimary,
    marginTop: 3,
    lineHeight: 21,
  },

  readingText: {
    ...typeScale.body,
    color: colors.textSecondary,
    textAlign: 'left',
    width: '100%',
    marginTop: spacing.md,
    lineHeight: 23,
  },

  loadingBlock: {
    minHeight: 82,
    marginTop: spacing.sm,
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
    marginTop: spacing.md,
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
