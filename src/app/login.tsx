/**
 * FreshG – Login Screen (Week 5: Sprint 04 - Task 01)
 *
 * Mengimplementasikan:
 * - Form input email & password
 * - Autentikasi API berbasis Token (JWT / Bearer)
 * - Penyimpanan token aman (SecureStore)
 * - Transisi ke status authenticated
 */
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

// ─── Design Tokens (Konsisten dengan FreshG) ──────────────────────────────────
const C = {
  primary:            '#006c49',
  primaryContainer:   '#10b981',
  onPrimary:          '#ffffff',
  surface:            '#f8f9ff',
  surfaceContainer:   '#e5eeff',
  surfaceContainerLow:'#eff4ff',
  surfaceContainerHigh:'#dce9ff',
  surfaceLowest:      '#ffffff',
  onSurface:          '#0b1c30',
  onSurfaceVariant:   '#3c4a42',
  outline:            '#6c7a71',
  outlineVariant:     '#bbcabf',
  error:              '#ba1a1a',
  errorContainer:     '#ffdad6',
  onErrorContainer:   '#93000a',
  secondaryContainer: '#82f5c1',
  onSecondaryContainer: '#00714e',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fungsi pengisi otomatis untuk kemudahan demo saat penilaian
  const handleQuickFillDemo = () => {
    setEmail('sari.rahmawati@email.com');
    setPassword('password123');
    setErrorMessage(null);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Silakan masukkan email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login({ email, password });
    setIsLoading(false);

    if (result.success) {
      console.log('[LoginScreen] Login berhasil, mengarahkan ke beranda...');
      router.replace('/');
    } else {
      setErrorMessage(result.error ?? 'Login gagal. Periksa kembali email dan kata sandi Anda.');
    }
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.keyboardView}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={s.brandSection}>
            <View style={s.brandLogoWrap}>
              <MaterialCommunityIcons name="leaf" size={32} color={C.primary} />
            </View>
            <Text style={s.brandTitle}>FreshG</Text>
            <View style={s.sprintBadge}>
              <Text style={s.sprintBadgeTxt}>Sprint 04 • Secure API</Text>
            </View>
          </View>

          {/* Welcome Message */}
          <View style={s.headerSection}>
            <Text style={s.welcomeTitle}>Selamat Datang Kembali</Text>
            <Text style={s.welcomeSub}>
              Masuk dengan akun terdaftar untuk mengakses manajemen bahan makanan segar Anda.
            </Text>
          </View>

          {/* Form Card */}
          <View style={s.formCard}>
            {/* Error Banner */}
            {errorMessage && (
              <View style={s.errorBanner}>
                <MaterialIcons name="error-outline" size={20} color={C.error} />
                <Text style={s.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {/* Email Field */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Alamat Email</Text>
              <View style={s.inputContainer}>
                <MaterialIcons name="email" size={20} color={C.outline} style={s.inputIcon} />
                <TextInput
                  style={s.textInput}
                  placeholder="nama@email.com"
                  placeholderTextColor={C.outlineVariant}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Kata Sandi</Text>
              <View style={s.inputContainer}>
                <MaterialIcons name="lock" size={20} color={C.outline} style={s.inputIcon} />
                <TextInput
                  style={s.textInput}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={C.outlineVariant}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                  style={s.eyeButton}
                  accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={C.outline}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Demo Credentials Button */}
            <TouchableOpacity
              style={s.demoBtn}
              onPress={handleQuickFillDemo}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={C.primary} />
              <Text style={s.demoBtnText}>Isi Otomatis Akun Demo (Sari Rahmawati)</Text>
            </TouchableOpacity>

            {/* Login Action Button */}
            <TouchableOpacity
              style={[s.loginBtn, isLoading && s.loginBtnDisabled]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={s.loginBtnLoading}>
                  <ActivityIndicator color={C.onPrimary} size="small" />
                  <Text style={s.loginBtnText}>Memverifikasi Kredensial...</Text>
                </View>
              ) : (
                <View style={s.loginBtnRow}>
                  <Text style={s.loginBtnText}>Masuk ke FreshG</Text>
                  <MaterialIcons name="arrow-forward" size={20} color={C.onPrimary} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Security & Token Info Footer */}
          <View style={s.securityBadge}>
            <MaterialIcons name="security" size={16} color={C.onSecondaryContainer} />
            <Text style={s.securityBadgeTxt}>
              Dilindungi dengan Token JWT & SecureStore (Keychain / Keystore)
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.surface,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLogoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.surfaceContainer,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -0.5,
  },
  sprintBadge: {
    backgroundColor: C.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    marginTop: 6,
  },
  sprintBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 0.3,
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.onSurface,
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  formCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.surfaceContainerHigh + 'B3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.errorContainer,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: C.onErrorContainer,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.onSurface,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.surfaceContainerHigh,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: C.onSurface,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainer,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.surfaceContainerHigh,
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },
  loginBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.onPrimary,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.secondaryContainer + '50',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: C.secondaryContainer,
  },
  securityBadgeTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: C.onSecondaryContainer,
    textAlign: 'center',
  },
});

