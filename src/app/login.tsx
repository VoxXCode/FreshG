import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  primary: '#006c49',
  primaryContainer: '#10b981',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#00422b',
  secondaryContainer: '#82f5c1',
  onSecondaryContainer: '#00714e',
  surface: '#f8f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainerHigh: '#dce9ff',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#3c4a42',
  outline: '#6c7a71',
  outlineVariant: '#bbcabf',
  background: '#f8f9ff',
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // State untuk menangani Loading & Error sesuai Modul 2 (Asynchronous & Fetch API)
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Konfigurasi URL API: localhost untuk Web / iOS, 10.0.2.2 untuk Android Emulator
  const API_URL = Platform.select({
    android: 'http://10.0.2.2:3000/api/login',
    default: 'http://localhost:3000/api/login',
  });

  /**
   * handleLogin()
   * Mengimplementasikan Fetch API dengan method POST dan penanganan error HTTP
   * Referensi: Modul 2 - Bab 7.2 (Async/Await), Bab 8 (REST API), Bab 9 (Fetch API)
   */
  const handleLogin = async () => {
    setErrorMessage('');

    // 1. Validasi di sisi Client sebelum mengirim request
    if (!identifier.trim()) {
      setErrorMessage('Email atau nomor HP wajib diisi!');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Kata sandi wajib diisi!');
      return;
    }

    try {
      // 2. Mengaktifkan loading state (Modul 2 Hal 33-34)
      setIsLoading(true);

      // 3. Mengirim HTTP POST request ke server (Modul 2 Hal 30-31)
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: identifier.trim(),
          password: password,
        }),
      });

      // 4. Mengubah response menjadi format JSON (Modul 2 Hal 28)
      const data = await response.json();

      // 5. Penanganan Error HTTP: periksa response.ok (Modul 2 Hal 31-32)
      // Fetch tidak otomatis melempar error untuk status 400/401/500
      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan saat masuk.');
      }

      // 6. Request Berhasil (HTTP Status Code 200 OK)
      Alert.alert(
        'Login Berhasil',
        `Selamat datang kembali, ${data.user?.fullName || data.user?.username || 'Pengguna'}!`,
        [
          {
            text: 'Masuk Beranda',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error: any) {
      // 7. Menangkap dan menampilkan error message (Modul 2 Hal 32)
      setErrorMessage(error.message || 'Gagal terhubung ke server backend.');
    } finally {
      // 8. Menonaktifkan loading state setelah request selesai
      setIsLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <ScrollView
        contentContainerStyle={[
          s.scrollContainer,
          { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={s.brandPill}>
            <View style={s.brandIconWrap}>
              <MaterialIcons name="eco" size={15} color={C.surfaceContainerLowest} />
            </View>
            <Text style={s.brandText}>FreshG</Text>
          </View>

          <TouchableOpacity style={s.iconButton}>
            <MaterialIcons name="help-outline" size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Header Hero */}
        <View style={s.heroContainer}>
          <View style={s.heroBadge}>
            <MaterialIcons name="psychology" size={14} color={C.onSecondaryContainer} />
            <Text style={s.heroBadgeText}>Kelola Kulkas & Kurangi Food Waste</Text>
          </View>
          <Text style={s.heroTitle}>Selamat Datang Kembali!</Text>
          <Text style={s.heroSubtitle}>
            Masuk untuk memantau kesegaran stok dapur dan rekomendasi menu hematmu hari ini.
          </Text>
        </View>

        {/* Form Card */}
        <View style={s.card}>
          {/* Tampilan Error Message dinamis sesuai Modul 2 */}
          {errorMessage ? (
            <View style={s.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#dc2626" />
              <Text style={s.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Email atau Nomor HP</Text>
            <View style={s.inputWrapper}>
              <MaterialIcons name="mail" size={20} color={C.onSurfaceVariant} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="nama@email.com atau 0812..."
                placeholderTextColor={C.outline}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Kata Sandi</Text>
            <View style={s.inputWrapper}>
              <MaterialIcons name="lock" size={20} color={C.onSurfaceVariant} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Masukkan setidaknya 8 karakter"
                placeholderTextColor={C.outline}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={s.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={C.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.utilityRow}>
            <TouchableOpacity
              style={s.checkboxWrap}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View style={[s.checkbox, rememberMe && s.checkboxActive]}>
                {rememberMe && <MaterialIcons name="check" size={12} color={C.onPrimary} />}
              </View>
              <Text style={s.rememberText}>Ingat Saya</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={s.forgotText}>Lupa Kata Sandi?</Text>
            </TouchableOpacity>
          </View>

          {/* Tombol Submit dengan Loading State (Modul 2 Hal 33-34) */}
          <TouchableOpacity
            style={[s.primaryBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={C.onPrimary} size="small" />
            ) : (
              <>
                <Text style={s.primaryBtnText}>Masuk ke FreshG</Text>
                <MaterialIcons name="arrow-forward" size={18} color={C.onPrimary} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={s.dividerContainer}>
          <View style={s.dividerLine} />
          <View style={s.dividerTextWrap}>
            <Text style={s.dividerText}>atau masuk dengan</Text>
          </View>
        </View>

        {/* Social Logins */}
        <View style={s.socialRow}>
          <TouchableOpacity style={s.socialBtn} activeOpacity={0.8}>
            <Text style={s.socialBtnText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.socialBtn} activeOpacity={0.8}>
            <Text style={s.socialBtnText}>Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Impact Banner */}
        <View style={s.impactBanner}>
          <View style={s.impactIconWrap}>
            <MaterialIcons name="energy-savings-leaf" size={18} color={C.primary} />
          </View>
          <Text style={s.impactText}>
            Sudah menghemat lebih dari <Text style={{ fontWeight: 'bold' }}>10.000+ kg</Text> bahan makanan bulan ini bersama komunitas FreshG.
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Belum punya akun?{' '}
            <Text style={s.footerLink} onPress={() => { }}>
              Daftar Sekarang
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  glowSecondary: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: C.secondaryContainer,
    opacity: 0.4,
    ...Platform.select({
      ios: { shadowColor: C.secondaryContainer, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 60 },
      android: { elevation: 10 },
    }),
  },
  glowSurface: {
    position: 'absolute',
    top: '33%',
    left: -80,
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: C.surfaceContainerHigh,
    opacity: 0.6,
    ...Platform.select({
      ios: { shadowColor: C.surfaceContainerHigh, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 60 },
      android: { elevation: 10 },
    }),
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(187, 202, 191, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(187, 202, 191, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  brandIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.primary,
    letterSpacing: -0.2,
  },
  heroContainer: {
    marginBottom: 24,
    zIndex: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(130, 245, 193, 0.4)',
    borderWidth: 1,
    borderColor: C.secondaryContainer,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.onSecondaryContainer,
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.onSurface,
    lineHeight: 32,
    letterSpacing: -0.24,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: C.onSurfaceVariant,
    lineHeight: 22,
  },
  card: {
    backgroundColor: C.surfaceContainerLowest,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(187, 202, 191, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.onSurface,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(187, 202, 191, 0.6)',
    borderRadius: 12,
    backgroundColor: 'rgba(239, 244, 255, 0.4)',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: C.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eyeButton: {
    padding: 4,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  checkboxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(187, 202, 191, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: C.primaryContainer,
    borderColor: C.primaryContainer,
  },
  rememberText: {
    fontSize: 14,
    color: C.onSurfaceVariant,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  primaryBtn: {
    backgroundColor: C.primaryContainer,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.onPrimary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(187, 202, 191, 0.3)',
  },
  dividerTextWrap: {
    backgroundColor: C.background, // Match background to obscure the line behind text
    paddingHorizontal: 12,
    zIndex: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.outline,
    letterSpacing: 0.2,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(187, 202, 191, 0.4)',
    backgroundColor: C.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.onSurface,
  },
  impactBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(130, 245, 193, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(130, 245, 193, 0.6)',
    borderRadius: 12,
    padding: 12,
    marginTop: 24,
    zIndex: 10,
  },
  impactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  impactText: {
    flex: 1,
    fontSize: 13,
    color: C.onSecondaryContainer,
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
    zIndex: 10,
  },
  footerText: {
    fontSize: 14,
    color: C.onSurfaceVariant,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
    color: C.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '500',
  },
});
