/**
 * Todo Type Definition – FreshG
 * Sesuai dengan spesifikasi REST API JSONPlaceholder (Week 9 PPT Slide 15)
 */

export interface TodoItem {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}

export type NewTodoInput = {
  title: string;
  completed?: boolean;
  userId?: number;
};

