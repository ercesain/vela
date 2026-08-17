import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  CelestialDecoration,
  IconButton,
  OracleAvatar,
  ReadingBubble,
  ReadingCardMessage,
  SecondaryButton,
  celestialPresets,
} from '@/components';
import { cardInterpretations, followUpMessage, getMockedOracleReply, openingMessage, tarotCards } from '@/data';
import { colors, radius, spacing, typeScale } from '@/theme';
import type { ReadingMessage, TarotCardId } from '@/types';

const LUNA_ARTWORK = require('../../assets/characters/luna.png');

let messageCounter = 0;
const nextId = () => `msg-${Date.now()}-${messageCounter++}`;

const timeNow = () =>
  new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

export default function ReadingResultScreen() {
  const { cards } = useLocalSearchParams<{ cards?: string }>();

  const drawnCardIds = useMemo<TarotCardId[]>(() => {
    const ids = (cards ?? '').split(',').filter(Boolean) as TarotCardId[];
    return ids.length > 0 ? ids : ['lovers'];
  }, [cards]);

  const firstCard = tarotCards.find((c) => c.id === drawnCardIds[0]) ?? tarotCards[0];

  const [messages, setMessages] = useState<ReadingMessage[]>(() => [
    { id: nextId(), type: 'text', role: 'oracle', text: openingMessage, timestamp: timeNow() },
    {
      id: nextId(),
      type: 'card',
      role: 'oracle',
      cardId: firstCard.id,
      interpretation: cardInterpretations[firstCard.id],
      timestamp: timeNow(),
    },
    { id: nextId(), type: 'text', role: 'oracle', text: followUpMessage, timestamp: timeNow() },
  ]);
  const [revealedCount, setRevealedCount] = useState(1);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const scrollToEnd = () => scrollRef.current?.scrollToEnd({ animated: true });

  const appendOracleReply = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), type: 'text', role: 'oracle', text, timestamp: timeNow() },
      ]);
      setTimeout(scrollToEnd, 50);
    }, 900);
  };

  const handleContinue = () => {
    appendOracleReply(getMockedOracleReply());
  };

  const handleDrawAnother = () => {
    const nextCard = tarotCards.find(
      (c) => drawnCardIds.includes(c.id) && !messages.some((m) => m.type === 'card' && m.cardId === c.id)
    );
    if (!nextCard) {
      appendOracleReply('Şimdilik çekecek başka kartın kalmadı, ama enerjini dilediğin zaman tekrar okuyabilirim.');
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        type: 'card',
        role: 'oracle',
        cardId: nextCard.id,
        interpretation: cardInterpretations[nextCard.id],
        timestamp: timeNow(),
      },
    ]);
    setRevealedCount((n) => n + 1);
    setTimeout(scrollToEnd, 50);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId(), type: 'text', role: 'user', text: trimmed, timestamp: timeNow() },
    ]);
    setInput('');
    setTimeout(scrollToEnd, 50);
    appendOracleReply(getMockedOracleReply());
  };

  return (
    <View style={styles.screen}>
      <CelestialDecoration items={celestialPresets.reading} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <IconButton glyph="‹" onPress={() => router.back()} />
          <View style={styles.headerCenter}>
            <OracleAvatar imageSource={LUNA_ARTWORK} size={40} online />
            <View style={styles.headerText}>
              <Text style={styles.headerName}>Luna</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Çevrimiçi</Text>
              </View>
            </View>
          </View>
          <IconButton glyph="⋯" />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
          >
            {messages.map((message) =>
              message.type === 'text' ? (
                <ReadingBubble key={message.id} role={message.role} text={message.text} timestamp={message.timestamp} />
              ) : (
                <ReadingCardMessage
                  key={message.id}
                  card={tarotCards.find((c) => c.id === message.cardId)!}
                  interpretation={message.interpretation}
                  timestamp={message.timestamp}
                />
              )
            )}

            {isTyping ? (
              <Animated.View entering={FadeIn.duration(200)} style={styles.typingRow}>
                <Text style={styles.typingText}>Luna yazıyor…</Text>
              </Animated.View>
            ) : null}

            <View style={styles.actionsRow}>
              <SecondaryButton label="DEVAM ET" accentColor={colors.gold} onPress={handleContinue} style={styles.actionButton} />
              <SecondaryButton
                label="BİR KART DAHA ÇEK"
                accentColor={colors.magenta}
                onPress={handleDrawAnother}
                style={styles.actionButton}
              />
            </View>
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Luna'ya mesaj yaz..."
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <IconButton glyph="➤" onPress={handleSend} style={styles.sendButton} />
          </View>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerText: {
    gap: 2,
  },
  headerName: {
    ...typeScale.bodyLarge,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    ...typeScale.caption,
    color: colors.textSecondary,
  },
  messages: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  typingRow: {
    marginBottom: spacing.md,
  },
  typingText: {
    ...typeScale.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typeScale.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  sendButton: {
    backgroundColor: colors.magenta,
    borderColor: colors.magenta,
  },
});
