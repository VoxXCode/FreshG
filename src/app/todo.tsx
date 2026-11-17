/**
 * FreshG – Todo Belanja & Manajemen Tugas Asinkron
 *
 * Mengimplementasikan 6 Fitur Wajib Penugasan Praktik: Todo List Async (Week 9 PPT Slide 15)
 * 1. Tampilkan Data API   : GET via useEffect() & fetch()
 * 2. Loading Indicator    : Tri-State dengan <ActivityIndicator size="large" />
 * 3. Menambahkan Todo     : POST form input teks ke REST API
 * 4. Ubah Status Tugas    : PATCH status selesai/belum secara dinamis
 * 5. Error Handling       : try...catch komprehensif + UI Error Feedback
 * 6. Refresh Data         : Re-fetch data dengan Tombol Reload & Pull-to-Refresh
 *
 * REST API Host: https://jsonplaceholder.typicode.com
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BottomTabInset } from '@/constants/theme';
import { todoApi, TodoApiError } from '@/data/services/todo-api';
import type { TodoItem } from '@/types/todo';

// ─── Design Tokens FreshG (Material 3 Emerald Theme) ──────────────────────────
const C = {
  primary:             '#006c49',
  primaryContainer:    '#10b981',
  onPrimary:           '#ffffff',
  surface:             '#f8f9ff',
  surfaceCard:         '#ffffff',
  surfaceContainer:    '#e5eeff',
  surfaceContainerLow: '#eff4ff',
  onSurface:           '#0b1c30',
  onSurfaceVariant:    '#3c4a42',
  outline:             '#6c7a71',
  outlineVariant:      '#bbcabf',
  error:               '#ba1a1a',
  errorContainer:      '#ffdad6',
  onErrorContainer:    '#93000a',
  success:             '#16a34a',
  successContainer:    '#dcfce7',
  onSuccessContainer:  '#14532d',
};

// Judul ramah tema belanja segar untuk melengkapi data default JSONPlaceholder
const FRESH_TITLES: Record<number, string> = {
  1: 'Beli Wortel & Brokoli Organik di Pasar',
  2: 'Restok Telur Ayam Kampung 1 Kg',
  3: 'Periksa masa simpan susu di kulkas',
  4: 'Beli Daging Sapi Segar untuk Rendang',
  5: 'Cek stok bumbu dapur: Jahe & Kunyit',
  6: 'Pisahkan apel matang dari buah lainnya',
  7: 'Beli Buah Alpukat Mentega 2 Buah',
  8: 'Bersihkan rak sayuran pada chiller kulkas',
  9: 'Restok Beras Merah & Biji Gandum',
  10: 'Beli Daun Kemangi & Jeruk Nipis',
};

export default function TodoAsyncScreen() {
  // ── 1. Tri-State Async State (Slide 9 & 15) ──────────────────────────────────
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [rawServerTodos, setRawServerTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State persistensi lokal agar data POST/PATCH tidak hilang saat re-fetch (Slide 15 Catatan Simulasi)
  const [userCreatedTodos, setUserCreatedTodos] = useState<TodoItem[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<number, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  // Form State untuk Tambah Todo (Slide 15 - Fitur 03)
  const [newTitle, setNewTitle] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Status loading untuk item individual yang sedang di-patch
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Mode simulasi error untuk demo evaluasi
  const [simulateFail, setSimulateFail] = useState<boolean>(false);

  // Helper untuk menggabungkan data server dengan input lokal pengguna
  const combineWithLocal = useCallback(
    (
      serverList: TodoItem[],
      createdList: TodoItem[],
      overrides: Record<number, boolean>,
      deleted: number[]
    ) => {
      const delSet = new Set(deleted);

      const activeCreated = createdList
        .filter((t) => !delSet.has(t.id))
        .map((t) => ({
          ...t,
          completed: overrides[t.id] !== undefined ? overrides[t.id] : t.completed,
        }));

      const activeServer = serverList
        .filter((t) => !delSet.has(t.id))
        .map((t) => ({
          ...t,
          title: FRESH_TITLES[t.id] || t.title,
          completed: overrides[t.id] !== undefined ? overrides[t.id] : t.completed,
        }));

      return [...activeCreated, ...activeServer];
    },
    []
  );

  // ── FITUR 01 & 06: GET /todos (Slide 8, 10, 15) ──────────────────────────────
  const refetch = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      if (simulateFail) {
        throw new TodoApiError('Simulasi: Gagal menghubungi REST API (Error 500)', 500);
      }

      const serverData = await todoApi.getTodos(10);
      setRawServerTodos(serverData);
      setTodos(combineWithLocal(serverData, userCreatedTodos, statusOverrides, deletedIds));
    } catch (err: unknown) {
      const message =
        err instanceof TodoApiError
          ? err.message
          : 'Terjadi kesalahan saat memuat data dari server online.';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, [simulateFail, combineWithLocal, userCreatedTodos, statusOverrides, deletedIds]);

  // useEffect dengan Dependency Array [] dan AbortController Cleanup (Slide 10)
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const fetchInitialData = async () => {
      try {
        if (simulateFail) {
          throw new TodoApiError('Simulasi: Gagal menghubungi REST API (Error 500)', 500);
        }

        // Memanggil REST API online (JSONPlaceholder)
        const serverData = await todoApi.getTodos(10, controller.signal);

        if (!isCancelled) {
          setRawServerTodos(serverData);
          setTodos(combineWithLocal(serverData, userCreatedTodos, statusOverrides, deletedIds));
          setError(null);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const message =
            err instanceof TodoApiError
              ? err.message
              : 'Terjadi kesalahan saat memuat data dari server online.';
          setError(message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void fetchInitialData();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [simulateFail, combineWithLocal, userCreatedTodos, statusOverrides, deletedIds]);

  // ── FITUR 03: POST /todos (Slide 14 & 15) ────────────────────────────────────
  const handleAddTodo = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      Alert.alert('Perhatian', 'Nama tugas atau bahan belanjaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (simulateFail) {
        throw new TodoApiError('Simulasi: Gagal mengirim data POST ke server.', 500);
      }

      // Mengirim POST request nyata ke REST API
      const created = await todoApi.createTodo({
        title: trimmed,
        completed: false,
        userId: 1,
      });

      // Simpan di created list agar saat di-refresh tidak terhapus
      const newItem: TodoItem = {
        id: Date.now(),
        userId: 1,
        title: created.title || trimmed,
        completed: false,
      };

      const nextCreated = [newItem, ...userCreatedTodos];
      setUserCreatedTodos(nextCreated);
      setTodos(combineWithLocal(rawServerTodos, nextCreated, statusOverrides, deletedIds));
      setNewTitle('');
      Alert.alert('Sukses (POST 201 OK)', `"${trimmed}" berhasil dikirim ke server & tersimpan di daftar.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan tugas.';
      Alert.alert('Error (POST Gagal)', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── FITUR 04: PATCH /todos/:id (Slide 15) ────────────────────────────────────
  const handleToggleTodo = async (item: TodoItem) => {
    const newStatus = !item.completed;
    setUpdatingId(item.id);

    try {
      if (simulateFail) {
        throw new TodoApiError('Simulasi: Gagal memperbarui status via PATCH.', 500);
      }

      // Panggilan PATCH nyata ke REST API
      await todoApi.patchTodoStatus(item.id, newStatus);

      // Catat override status agar saat refresh status tetap terjaga
      const nextOverrides = { ...statusOverrides, [item.id]: newStatus };
      setStatusOverrides(nextOverrides);
      setTodos(combineWithLocal(rawServerTodos, userCreatedTodos, nextOverrides, deletedIds));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status.';
      Alert.alert('Error (PATCH Gagal)', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Operasi DELETE /todos/:id (Optimistic UI & Cross-platform Web/Mobile) ──
  const executeDelete = async (item: TodoItem) => {
    // 1. Optimistic Update: langsung hilangkan item dari UI secara instan
    const nextDeleted = [...deletedIds, item.id];
    setDeletedIds(nextDeleted);
    setUserCreatedTodos((prev) => prev.filter((t) => t.id !== item.id));
    setTodos((prev) => prev.filter((t) => t.id !== item.id));

    // 2. Kirim request DELETE ke REST API secara asinkron di latar belakang
    try {
      if (simulateFail) {
        throw new TodoApiError('Simulasi: Gagal menghapus item dari server (Error 500)', 500);
      }
      await todoApi.deleteTodo(item.id);
      console.log('[TodoApp] Sukses menghapus item:', item.id, item.title);
    } catch (err: unknown) {
      console.error('[TodoApp] Gagal menghapus di server:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menghapus item dari server.';
      if (Platform.OS === 'web') {
        window.alert(`Perhatian: ${msg}`);
      } else {
        Alert.alert('Perhatian', msg);
      }
    }
  };

  const handleDeleteTodo = (item: TodoItem) => {
    // Dukungan untuk Web browser di mana Alert.alert native tidak menjalankan callback
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Hapus "${item.title}" dari daftar?`);
      if (ok) {
        void executeDelete(item);
      }
      return;
    }

    // Modal konfirmasi native di Android / iOS
    Alert.alert(
      'Hapus Item',
      `Hapus "${item.title}" dari server dan daftar?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            void executeDelete(item);
          },
        },
      ]
    );
  };

  // Statistik Tugas
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [todos]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* ── App Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <Text style={styles.headerTitle}>Daftar Belanja</Text>
          </View>
          <Text style={styles.headerSubtitle}></Text>
        </View>

        {/* Tombol Reload Data (Fitur 06: Refresh Data) */}
        <TouchableOpacity
          style={styles.reloadBtn}
          onPress={() => refetch()}
          disabled={loading || refreshing}
          accessibilityLabel="Muat Ulang Data"
        >
          <MaterialIcons name="refresh" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Form Tambah Todo (Fitur 03: POST /todos) ─────────────────────── */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Tambah tugas/bahan belanja baru..."
            placeholderTextColor={C.outline}
            value={newTitle}
            onChangeText={setNewTitle}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={[styles.addBtn, isSubmitting && styles.addBtnDisabled]}
            onPress={handleAddTodo}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={C.onPrimary} />
            ) : (
              <>
                <MaterialIcons name="add" size={18} color={C.onPrimary} />
                <Text style={styles.addBtnText}>Tambah</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Statistik Bar & Kontrol Pengujian ─────────────────────────────── */}
        <View style={styles.statsBar}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Total: </Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: C.successContainer }]}>
            <Text style={[styles.statLabel, { color: C.onSuccessContainer }]}>Selesai: </Text>
            <Text style={[styles.statValue, { color: C.onSuccessContainer }]}>{stats.completed}</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: C.surfaceContainer }]}>
            <Text style={styles.statLabel}>Tertunda: </Text>
            <Text style={styles.statValue}>{stats.pending}</Text>
          </View>

          {/* Toggle Simulasi Error untuk Pembuktian Pengujian */}
          <TouchableOpacity
            style={[
              styles.simErrorBtn,
              simulateFail && { backgroundColor: C.errorContainer, borderColor: C.error },
            ]}
            onPress={() => setSimulateFail((prev) => !prev)}
          >
            <MaterialIcons
              name={simulateFail ? 'error' : 'check-circle-outline'}
              size={14}
              color={simulateFail ? C.error : C.outline}
            />
            <Text style={[styles.simErrorText, simulateFail && { color: C.error }]}>
              {simulateFail ? 'Simulasi Error: ON' : 'Simulasi Error'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Konten Utama: Tri-State Handling (Slide 9 & 15) ───────────────── */}
        {loading ? (
          // 1. FASE LOADING: Indikator Spinner (Fitur 02)
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Menghubungkan ke REST API online...</Text>
            <Text style={styles.loadingSubtext}>https://jsonplaceholder.typicode.com/todos</Text>
          </View>
        ) : error ? (
          // 2. FASE ERROR: Menampilkan Pesan Gagal & Tombol Retry (Fitur 05)
          <View style={styles.centerContainer}>
            <View style={styles.errorIconWrap}>
              <MaterialIcons name="cloud-off" size={40} color={C.error} />
            </View>
            <Text style={styles.errorTitle}>Gagal Mengambil Data</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setSimulateFail(false);
                setLoading(true);
                void refetch().then(() => setLoading(false));
              }}
            >
              <MaterialIcons name="replay" size={18} color={C.onPrimary} />
              <Text style={styles.retryBtnText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // 3. FASE SUKSES: Render Daftar Data ke FlatList (Fitur 01 & 04)
          <FlatList
            data={todos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: BottomTabInset + 40 },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => refetch()}
                colors={[C.primary]}
                tintColor={C.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={48} color={C.outlineVariant} />
                <Text style={styles.emptyText}>Belum ada tugas atau daftar belanjaan.</Text>
                <Text style={styles.emptySubtext}>Gunakan form di atas untuk menambahkan item baru.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isUpdating = updatingId === item.id;

              return (
                <View style={[styles.todoCard, item.completed && styles.todoCardCompleted]}>
                  {/* Tombol Toggle Status (Fitur 04: PATCH) */}
                  <TouchableOpacity
                    style={styles.checkBtn}
                    onPress={() => handleToggleTodo(item)}
                    disabled={isUpdating}
                    activeOpacity={0.7}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={C.primary} />
                    ) : (
                      <MaterialCommunityIcons
                        name={
                          item.completed
                            ? 'checkbox-marked-circle'
                            : 'checkbox-blank-circle-outline'
                        }
                        size={24}
                        color={item.completed ? C.success : C.outline}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Judul Todo */}
                  <View style={styles.titleWrap}>
                    <Text
                      style={[
                        styles.todoTitle,
                        item.completed && styles.todoTitleCompleted,
                      ]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>
                        ID: #{item.id} • {item.completed ? 'Selesai (PATCH 200)' : 'Perlu Dikerjakan'}
                      </Text>
                    </View>
                  </View>

                  {/* Tombol Hapus (DELETE) */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteTodo(item)}
                    activeOpacity={0.6}
                    hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                    accessibilityLabel={`Hapus item ${item.title}`}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color={C.error} />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainer,
  },
  headerLeft: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.onSurface,
    letterSpacing: -0.3,
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.successContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.success,
  },
  badgeLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.onSuccessContainer,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  reloadBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: C.surfaceContainer,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: C.surface,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: C.surfaceCard,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: C.onSurface,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
  addBtnText: {
    color: C.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    backgroundColor: C.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 11,
    color: C.onSurfaceVariant,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 11,
    fontWeight: '800',
    color: C.onSurface,
  },
  simErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: C.outlineVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  simErrorText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.outline,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  todoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceCard,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.surfaceContainer,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  todoCardCompleted: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    opacity: 0.85,
  },
  checkBtn: {
    padding: 4,
  },
  titleWrap: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.onSurface,
    lineHeight: 20,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: C.outline,
  },
  metaRow: {
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: C.outline,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: C.onSurface,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: C.outline,
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.error,
  },
  errorMessage: {
    marginTop: 6,
    fontSize: 13,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  retryBtnText: {
    color: C.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
    color: C.onSurfaceVariant,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: C.outline,
  },
});

