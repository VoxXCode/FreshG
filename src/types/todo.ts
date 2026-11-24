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

