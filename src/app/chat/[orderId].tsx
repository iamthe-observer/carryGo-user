import { useLocalSearchParams, useRouter } from 'expo-router';
import { Phone, Send, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/services/notifications';
import { useCarryGoStore } from '@/store/useCarryGoStore';

const QUICK_REPLIES = [
  "I'm at the front gate",
  'Please call when you arrive',
  'How far are you?',
  'Parcel is fragile, handle with care',
];

export default function RiderChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { palette } = useAppTheme();
  const listRef = useRef<FlatList>(null);

  const order = useCarryGoStore((s) => s.orders.find((o) => o.id === orderId));
  const messages = useCarryGoStore(
    (s) => (orderId ? s.messagesByOrder[orderId] ?? [] : [])
  );
  const sendOrderMessage = useCarryGoStore((s) => s.sendOrderMessage);

  const [text, setText] = useState('');

  const handleSend = (override?: string) => {
    const body = (override ?? text).trim();
    if (!body || !orderId) return;
    triggerHaptic('light');
    sendOrderMessage(orderId, body);
    if (!override) setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: palette.surface, borderBottomColor: palette.border },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.driverName, { color: palette.ink }]}>
            {order?.driver?.name ?? 'CarryGo Rider'}
          </Text>
          <Text style={[styles.driverMeta, { color: palette.inkSecondary }]}>
            {order?.trackingCode} · {order?.driver?.plate ?? 'Assigned courier'}
          </Text>
        </View>

        {order?.driver?.phone && (
          <Pressable
            onPress={() =>
              Linking.openURL(
                `tel:${order.driver!.phone.replace(/\s+/g, '')}`
              ).catch(() => {})
            }
            style={[styles.iconBtn, { backgroundColor: palette.mintSoft }]}
          >
            <Phone size={18} color={palette.mint} />
          </Pressable>
        )}

        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: palette.surfaceAlt }]}
        >
          <X size={18} color={palette.ink} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => {
            if (item.senderRole === 'system') {
              return (
                <View style={styles.systemWrap}>
                  <Text
                    style={[styles.systemText, { color: palette.inkMuted }]}
                  >
                    {item.body}
                  </Text>
                </View>
              );
            }
            const isUser = item.senderRole === 'user';
            return (
              <View
                style={[
                  styles.bubble,
                  {
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    backgroundColor: isUser ? palette.ink : palette.surface,
                    borderColor: isUser ? palette.ink : palette.border,
                    borderWidth: isUser ? 0 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    { color: isUser ? palette.inkInverse : palette.ink },
                  ]}
                >
                  {item.body}
                </Text>
                <Text
                  style={[
                    styles.bubbleTime,
                    {
                      color: isUser
                        ? 'rgba(255,255,255,0.65)'
                        : palette.inkMuted,
                    },
                  ]}
                >
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
        />

        {/* Quick Reply Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickBar}
          contentContainerStyle={styles.quickContent}
        >
          {QUICK_REPLIES.map((qr) => (
            <Pressable
              key={qr}
              onPress={() => handleSend(qr)}
              style={[
                styles.quickChip,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.quickText, { color: palette.ink }]}>
                {qr}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Composer */}
        <View
          style={[
            styles.composer,
            { backgroundColor: palette.surface, borderTopColor: palette.border },
          ]}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message your rider..."
            placeholderTextColor={palette.inkMuted}
            style={[
              styles.input,
              {
                backgroundColor: palette.surfaceAlt,
                color: palette.ink,
              },
            ]}
          />
          <Pressable
            onPress={() => handleSend()}
            style={[styles.sendBtn, { backgroundColor: palette.brand }]}
          >
            <Send size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '800',
  },
  driverMeta: {
    fontSize: 12.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgList: {
    padding: 16,
    gap: 10,
  },
  systemWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  systemText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    gap: 4,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 10.5,
    alignSelf: 'flex-end',
  },
  quickBar: {
    maxHeight: 46,
  },
  quickContent: {
    paddingHorizontal: 14,
    gap: 8,
    alignItems: 'center',
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  quickText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    fontSize: 14.5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
