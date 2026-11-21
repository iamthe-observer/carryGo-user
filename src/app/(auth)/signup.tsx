import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, Mail, Phone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useCarryGoStore } from '@/store/useCarryGoStore';

export default function SignupScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const signupSupabase = useCarryGoStore((s) => s.signupSupabase);
  const loginDemo = useCarryGoStore((s) => s.loginDemo);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+233 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignup = async () => {
    setErrorMsg(null);
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setErrorMsg('Enter your name, valid email, and a password (6+ chars).');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg(
        'Supabase keys are not configured in .env yet. Tap "Continue with Demo Account" to test right away.'
      );
      return;
    }

    setLoading(true);
    try {
      await signupSupabase({ email, password, fullName, phone });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to create account.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <ArrowLeft size={20} color={palette.ink} />
          </Pressable>

          <View style={styles.header}>
            <Text style={[styles.heading, { color: palette.ink }]}>
              Create your CarryGo account
            </Text>
            <Text style={[styles.subheading, { color: palette.inkSecondary }]}>
              Send packages across Accra with transparent GH₵ rates and PIN-verified drop-offs.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.inkSecondary }]}>
                Full name
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <User size={18} color={palette.inkMuted} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ama Serwaa"
                  placeholderTextColor={palette.inkMuted}
                  style={[styles.input, { color: palette.ink }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.inkSecondary }]}>
                Phone number
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <Phone size={18} color={palette.inkMuted} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+233 24 000 0000"
                  placeholderTextColor={palette.inkMuted}
                  keyboardType="phone-pad"
                  style={[styles.input, { color: palette.ink }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.inkSecondary }]}>
                Email address
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <Mail size={18} color={palette.inkMuted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ama@example.com"
                  placeholderTextColor={palette.inkMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: palette.ink }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.inkSecondary }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <Lock size={18} color={palette.inkMuted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={palette.inkMuted}
                  secureTextEntry
                  style={[styles.input, { color: palette.ink }]}
                />
              </View>
            </View>

            {errorMsg && (
              <View
                style={[styles.errorBox, { backgroundColor: palette.dangerSoft }]}
              >
                <Text style={[styles.errorText, { color: palette.danger }]}>
                  {errorMsg}
                </Text>
              </View>
            )}

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              variant="primary"
            />

            <Button
              title="Continue with Demo Account"
              onPress={() => {
                loginDemo();
                router.replace('/(tabs)');
              }}
              variant="brand"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    gap: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  errorBox: {
    padding: 12,
    borderRadius: Radius.sm,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
