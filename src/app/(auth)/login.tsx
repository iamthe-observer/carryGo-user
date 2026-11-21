import { Link, useRouter } from 'expo-router';
import { Lock, Mail, Sparkles } from 'lucide-react-native';
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

import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useCarryGoStore } from '@/store/useCarryGoStore';

export default function LoginScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const loginDemo = useCarryGoStore((s) => s.loginDemo);
  const loginSupabase = useCarryGoStore((s) => s.loginSupabase);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg(
        'Supabase keys are not set in .env yet. Use "Continue with Demo Account" below for instant testing.'
      );
      return;
    }

    setLoading(true);
    try {
      await loginSupabase(email, password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    loginDemo();
    router.replace('/(tabs)');
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
          <View style={styles.header}>
            <BrandLogo size="lg" />
            <Text style={[styles.heading, { color: palette.ink }]}>
              Welcome back
            </Text>
            <Text style={[styles.subheading, { color: palette.inkSecondary }]}>
              Sign in to dispatch parcels across Accra with live GPS tracking.
            </Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isSupabaseConfigured
                  ? palette.mintSoft
                  : palette.amberSoft,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isSupabaseConfigured
                    ? palette.mint
                    : palette.amber,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: isSupabaseConfigured ? palette.mint : palette.amber,
                },
              ]}
            >
              {isSupabaseConfigured
                ? 'Supabase Cloud Connected'
                : 'Demo Fallback Mode (Add .env keys anytime)'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: palette.inkSecondary }]}>
                Email address
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Mail size={18} color={palette.inkMuted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
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
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Lock size={18} color={palette.inkMuted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={palette.inkMuted}
                  secureTextEntry
                  style={[styles.input, { color: palette.ink }]}
                />
              </View>
            </View>

            {errorMsg && (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: palette.dangerSoft },
                ]}
              >
                <Text style={[styles.errorText, { color: palette.danger }]}>
                  {errorMsg}
                </Text>
              </View>
            )}

            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              variant="primary"
            />

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: palette.border }]} />
              <Text style={[styles.dividerText, { color: palette.inkMuted }]}>
                OR TEST INSTANTLY
              </Text>
              <View style={[styles.divider, { backgroundColor: palette.border }]} />
            </View>

            <Button
              title="Continue with Demo Account"
              onPress={handleDemo}
              variant="brand"
              icon={<Sparkles size={18} color="#FFFFFF" />}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: palette.inkSecondary }]}>
              New to CarryGo?
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable hitSlop={8}>
                <Text style={[styles.linkText, { color: palette.brand }]}>
                  Create Account
                </Text>
              </Pressable>
            </Link>
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
    paddingTop: 28,
    paddingBottom: 32,
    justifyContent: 'space-between',
    gap: 24,
  },
  header: {
    gap: 12,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 8,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  form: {
    gap: 16,
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
    lineHeight: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
