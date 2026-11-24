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
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BottomTabInset } from '@/constants/theme';
import { todoApi, TodoApiError } from '@/data/services/todo-api';
import type { TodoItem } from '@/types/todo';

const C = {
  primary: '#064e3b',
  primaryLight: '#dcfce7',
  onPrimary: '#ffffff',
  background: '#f8fafc',
  cardBg: '#ffffff',
  textMain: '#1e293b',
  textMuted: '#64748b',
  border: '#f1f5f9',
  borderDark: '#e2e8f0',
  error: '#ef4444',
  errorBg: '#fee2e2',
  success: '#16a34a',
  successBg: '#dcfce7',
};

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

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [rawServerTodos, setRawServerTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [userCreatedTodos, setUserCreatedTodos] = useState<TodoItem[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<number, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const combineWithLocal = useCallback(
    (
      serverList: TodoItem[],
      createdList: TodoItem[],
      overrides: Record<number, boolean>,
      deleted: number[]
    ) => {
      const delSet = new Set(deleted);

      const activeCreated = createdList
        .filter(t => !delSet.has(t.id))
        .map(t => ({
          ...t,
          completed: overrides[t.id] !== undefined ? overrides[t.id] : t.completed,
        }));

      const activeServer = serverList
        .filter(t => !delSet.has(t.id))
        .map(t => ({
          ...t,
          title: FRESH_TITLES[t.id] || t.title,
          completed: overrides[t.id] !== undefined ? overrides[t.id] : t.completed,
        }));

      return [...activeCreated, ...activeServer];
    },
    []
  );

  const refetch = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
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
  }, [combineWithLocal, userCreatedTodos, statusOverrides, deletedIds]);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const fetchInitialData = async () => {
      try {
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
  }, [combineWithLocal, userCreatedTodos, statusOverrides, deletedIds]);

  const handleAddTodo = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      Alert.alert('Perhatian', 'Nama tugas atau bahan belanjaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await todoApi.createTodo({
        title: trimmed,
        completed: false,
        userId: 1,
      });

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
      setShowAddModal(false);
      Alert.alert('Sukses Ditambahkan', `"${trimmed}" berhasil disimpan ke daftar belanja.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan tugas.';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTodo = async (item: TodoItem) => {
    const newStatus = !item.completed;
    setUpdatingId(item.id);

    try {
      await todoApi.patchTodoStatus(item.id, newStatus);
      const nextOverrides = { ...statusOverrides, [item.id]: newStatus };
      setStatusOverrides(nextOverrides);
      setTodos(combineWithLocal(rawServerTodos, userCreatedTodos, nextOverrides, deletedIds));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status.';
      Alert.alert('Error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const executeDelete = async (item: TodoItem) => {
    const nextDeleted = [...deletedIds, item.id];
    setDeletedIds(nextDeleted);
    setUserCreatedTodos(prev => prev.filter(t => t.id !== item.id));
    setTodos(prev => prev.filter(t => t.id !== item.id));

    try {
      await todoApi.deleteTodo(item.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus item dari server.';
      if (Platform.OS === 'web') {
        window.alert(`Perhatian: ${msg}`);
      } else {
        Alert.alert('Perhatian', msg);
      }
    }
  };

  const handleDeleteTodo = (item: TodoItem) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Hapus "${item.title}" dari daftar belanja?`);
      if (ok) {
        void executeDelete(item);
      }
      return;
    }

    Alert.alert('Hapus Item', `Hapus "${item.title}" dari daftar belanja?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          void executeDelete(item);
        },
      },
    ]);
  };

  const filteredTodos = useMemo(() => {
    let list = todos;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => t.title.toLowerCase().includes(q));
    }

    return list.slice().sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  }, [todos, searchQuery]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView edges={['top']} style={s.topSafeArea} />

      <View style={s.headerContainer}>
        <Text style={s.headerTitle}>Daftar Belanja</Text>

        <TouchableOpacity
          style={s.roundBtn}
          activeOpacity={0.8}
          onPress={() => setShowAddModal(true)}
          accessibilityLabel="Tambah Belanjaan Baru"
        >
          <MaterialIcons name="add" size={26} color="#064e3b" />
        </TouchableOpacity>
      </View>

      <View style={s.searchContainer}>
        <View style={s.searchBar}>
          <Feather name="search" size={17} color="#064e3b" style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Cari daftar belanjaan..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 4 }}
            >
              <MaterialIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
          
        </View>
      </View>

      {loading ? (
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color="#064e3b" />
          <Text style={s.loadingText}>Menghubungkan ke REST API online...</Text>
          <Text style={s.loadingSubtext}>https://jsonplaceholder.typicode.com/todos</Text>
        </View>
      ) : error ? (
        <View style={s.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color={C.error} />
          <Text style={s.errorTitle}>Gagal Memuat Data</Text>
          <Text style={s.errorSubtitle}>{error}</Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => {
              setLoading(true);
              void refetch().then(() => setLoading(false));
            }}
          >
            <MaterialIcons name="replay" size={18} color="#ffffff" />
            <Text style={s.retryBtnText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTodos}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[s.listContainer, { paddingBottom: BottomTabInset + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refetch()}
              colors={['#064e3b']}
              tintColor="#064e3b"
            />
          }
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#94a3b8" />
              <Text style={s.emptyText}>Tidak ada belanjaan ditemukan.</Text>
              <Text style={s.emptySubtext}>
                {searchQuery.trim()
                  ? `Tidak ada item yang cocok dengan "${searchQuery}".`
                  : 'Tekan tombol "+" di kanan atas untuk menambah tugas belanja baru.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isUpdating = updatingId === item.id;

            return (
              <TouchableOpacity
                style={[s.card, item.completed && s.cardCompleted]}
                activeOpacity={0.75}
                onPress={() => handleToggleTodo(item)}
              >
                <TouchableOpacity
                  style={s.checkBtn}
                  onPress={() => handleToggleTodo(item)}
                  disabled={isUpdating}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={item.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#064e3b" />
                  ) : (
                    <MaterialCommunityIcons
                      name={
                        item.completed
                          ? 'checkbox-marked-circle'
                          : 'checkbox-blank-circle-outline'
                      }
                      size={25}
                      color={item.completed ? '#16a34a' : '#cbd5e1'}
                    />
                  )}
                </TouchableOpacity>

                <View style={s.cardMiddle}>
                  <Text
                    style={[s.cardTitle, item.completed && s.cardTitleCompleted]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </View>

                <TouchableOpacity
                  style={s.trashBtn}
                  onPress={() => handleDeleteTodo(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Hapus item"
                >
                  <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.modalBackdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAddModal(false)} />
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={s.modalTitleRow}>
                <MaterialIcons name="add-shopping-cart" size={22} color="#064e3b" />
                <Text style={s.modalTitle}>Tambah Belanjaan Baru</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={s.formGroup}>
              <Text style={s.formLabel}>Nama Bahan / Tugas</Text>
              <TextInput
                style={s.formInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Contoh: Beli Apel Fuji 1 Kg"
                placeholderTextColor="#94a3b8"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddTodo}
                editable={!isSubmitting}
              />
            </View>

            <View style={s.presetRow}>
              {['Sayuran Segar', 'Telur Ayam', 'Daging Sapi', 'Bumbu Dapur'].map(preset => (
                <TouchableOpacity
                  key={preset}
                  style={s.presetChip}
                  onPress={() => setNewTitle(`Beli ${preset}`)}
                >
                  <Text style={s.presetChipText}>+ {preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <Text style={s.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSaveBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleAddTodo}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={18} color="#ffffff" />
                    <Text style={s.modalSaveText}>Simpan ke Daftar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topSafeArea: {
    backgroundColor: '#f8fafc',
  },

  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: -0.4,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 44,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 22,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    paddingVertical: 0,
  },
  cameraBtn: {
    padding: 4,
  },

  listContainer: {
    paddingTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardCompleted: {
    opacity: 0.65,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  checkBtn: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMiddle: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
    fontWeight: '500',
  },
  trashBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#064e3b',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 11,
    color: '#94a3b8',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
  },
  formGroup: {
    marginBottom: 12,
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  presetChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
