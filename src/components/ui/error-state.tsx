import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ApiError } from '@/types/api-error';
import { useAppTheme } from '@/context/theme-context';

interface ErrorStateProps {
  error: ApiError | Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  title?: string;
  message?: string;
  compact?: boolean;
}

export function ErrorState({
  error,
  onRetry,
  isRetrying = false,
  title,
  message,
  compact = false,
}: ErrorStateProps) {
  const { colors: C, isDark } = useAppTheme();
  const [showDetails, setShowDetails] = useState(false);

  const apiError = error instanceof ApiError ? error : error ? ApiError.from(error) : null;
  const isOffline = apiError?.code === 'OFFLINE_ERROR';
  const isTimeout = apiError?.code === 'TIMEOUT_ERROR';
  const isServer = apiError?.code === 'SERVER_ERROR';

  // Tentukan ikon, warna latar, dan pesan default
  let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] = 'alert-circle-outline';
  let badgeBg = isDark ? '#450a0a' : '#fee2e2';
  let iconColor = isDark ? '#f87171' : '#b91c1c';
  let defaultTitle = 'Gagal Memuat Data';

  if (isOffline) {
    iconName = 'wifi-off';
    badgeBg = isDark ? '#451a03' : '#fef3c7';
    iconColor = isDark ? '#fbbf24' : '#d97706';
    defaultTitle = 'Koneksi Internet Terputus';
  } else if (isTimeout) {
    iconName = 'timer-alert-outline';
    badgeBg = isDark ? '#431407' : '#ffedd5';
    iconColor = isDark ? '#fb923c' : '#ea580c';
    defaultTitle = 'Waktu Permintaan Habis';
  } else if (isServer) {
    iconName = 'server-network-off';
    badgeBg = isDark ? '#450a0a' : '#fee2e2';
    iconColor = isDark ? '#f87171' : '#dc2626';
    defaultTitle = 'Gangguan Server FreshG';
  }

  const finalTitle = title ?? defaultTitle;
  const finalMessage = message ?? apiError?.userMessage ?? 'Terjadi kesalahan sistem. Silakan coba kembali.';

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: C.surfaceLowest, borderColor: isDark ? C.surfaceContainerHigh : '#f1f5f9' }]}>
        <View style={[styles.compactIcon, { backgroundColor: badgeBg }]}>
          <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.compactText}>
          <Text style={[styles.compactTitle, { color: C.onSurface }]}>{finalTitle}</Text>
          <Text style={[styles.compactMessage, { color: C.onSurfaceVariant }]} numberOfLines={2}>
            {finalMessage}
          </Text>
        </View>
        {onRetry && (
          <Pressable
            style={({ pressed }) => [
              styles.compactRetryBtn,
              { backgroundColor: isDark ? C.primaryContainer : '#e6f4ea' },
              pressed && styles.pressed,
            ]}
            onPress={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color={isDark ? C.onPrimaryContainer : C.primary} />
            ) : (
              <Text style={[styles.compactRetryText, { color: isDark ? C.onPrimaryContainer : C.primary }]}>Coba</Text>
            )}
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Icon Circle */}
      <View style={[styles.iconWrapper, { backgroundColor: badgeBg }]}>
        <MaterialCommunityIcons name={iconName} size={36} color={iconColor} />
      </View>

      {/* Title & Message */}
      <Text style={[styles.title, { color: C.onSurface }]}>{finalTitle}</Text>
      <Text style={[styles.message, { color: C.onSurfaceVariant }]}>{finalMessage}</Text>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {onRetry && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: C.primary },
              pressed && styles.pressed,
              isRetrying && styles.btnDisabled,
            ]}
            onPress={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.primaryBtnText}>Menghubungkan...</Text>
              </View>
            ) : (
              <View style={styles.btnLoadingRow}>
                <MaterialCommunityIcons name="refresh" size={18} color="#ffffff" />
                <Text style={styles.primaryBtnText}>Coba Lagi</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* Accordion Detail Teknis untuk Debugging */}
      {apiError && (
        <View style={[styles.detailsContainer, { backgroundColor: isDark ? C.surfaceContainerLow : '#f8fafc', borderColor: C.outlineVariant + (isDark ? '40' : '99') }]}>
          <Pressable
            style={styles.detailsToggle}
            onPress={() => setShowDetails(prev => !prev)}
          >
            <Text style={[styles.detailsToggleText, { color: C.outline }]}>
              {showDetails ? 'Sembunyikan Detail Teknis' : 'Lihat Detail Teknis (Error Info)'}
            </Text>
            <MaterialCommunityIcons
              name={showDetails ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={C.outline}
            />
          </Pressable>

          {showDetails && (
            <View style={[styles.detailsContent, { borderTopColor: C.outlineVariant + '66' }]}>
              <Text style={[styles.detailItem, { color: C.onSurfaceVariant }]}>
                <Text style={[styles.detailLabel, { color: C.onSurface }]}>Kode Error: </Text>
                {apiError.code}
              </Text>
              {apiError.statusCode !== undefined && (
                <Text style={[styles.detailItem, { color: C.onSurfaceVariant }]}>
                  <Text style={[styles.detailLabel, { color: C.onSurface }]}>Status Code: </Text>
                  {apiError.statusCode}
                </Text>
              )}
              <Text style={[styles.detailItem, { color: C.onSurfaceVariant }]}>
                <Text style={[styles.detailLabel, { color: C.onSurface }]}>Waktu: </Text>
                {apiError.timestamp.toLocaleTimeString('id-ID')}
              </Text>
              <Text style={[styles.detailItem, { color: C.onSurfaceVariant }]}>
                <Text style={[styles.detailLabel, { color: C.onSurface }]}>Pesan Teknis: </Text>
                {apiError.technicalMessage}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#006c49',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006c49',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  detailsContainer: {
    marginTop: 24,
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  detailsContent: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 4,
  },
  detailItem: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  detailLabel: {
    fontWeight: '700',
    color: '#334155',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginVertical: 6,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  compactIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactText: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  compactMessage: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  compactRetryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRetryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006c49',
  },
});
