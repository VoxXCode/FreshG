import { TodoItem, NewTodoInput } from '@/types/todo';

const BASE_URL = 'https://jsonplaceholder.typicode.com';
const DEFAULT_TIMEOUT_MS = 10000;

export class TodoApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'TodoApiError';
    this.statusCode = statusCode;
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new TodoApiError('Waktu koneksi habis (Timeout). Server terlalu lama merespons.', 408);
    }
    throw new TodoApiError('Gagal terhubung ke internet. Periksa koneksi perangkat Anda.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export const todoApi = {
  getTodos: async (limit: number = 10, signal?: AbortSignal): Promise<TodoItem[]> => {
    console.log(`[TodoApi] [GET] ${BASE_URL}/todos?_limit=${limit}`);

    const res = await fetchWithTimeout(`${BASE_URL}/todos?_limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal,
    });

    if (!res.ok) {
      throw new TodoApiError(
        `Server mengembalikan kode status ${res.status}: ${res.statusText}`,
        res.status
      );
    }

    const data: TodoItem[] = await res.json();
    return data;
  },

  createTodo: async (input: NewTodoInput): Promise<TodoItem> => {
    console.log(`[TodoApi] [POST] ${BASE_URL}/todos`, input);

    const res = await fetchWithTimeout(`${BASE_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        title: input.title,
        completed: input.completed ?? false,
        userId: input.userId ?? 1,
      }),
    });

    if (!res.ok) {
      throw new TodoApiError(
        `Gagal menambahkan data (HTTP ${res.status})`,
        res.status
      );
    }

    const created: TodoItem = await res.json();
    return created;
  },

  patchTodoStatus: async (id: number, completed: boolean): Promise<TodoItem> => {
    console.log(`[TodoApi] [PATCH] ${BASE_URL}/todos/${id}`, { completed });

    const res = await fetchWithTimeout(`${BASE_URL}/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ completed }),
    });

    if (!res.ok) {
      throw new TodoApiError(
        `Gagal memperbarui status (HTTP ${res.status})`,
        res.status
      );
    }

    const updated: TodoItem = await res.json();
    return updated;
  },

  deleteTodo: async (id: number): Promise<boolean> => {
    console.log(`[TodoApi] [DELETE] ${BASE_URL}/todos/${id}`);

    const res = await fetchWithTimeout(`${BASE_URL}/todos/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new TodoApiError(
        `Gagal menghapus item (HTTP ${res.status})`,
        res.status
      );
    }

    return true;
  },
};
