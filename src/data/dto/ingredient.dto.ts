export interface IngredientDTO {
  id: number;
  ingredient_name: string;
  category_name: string;
  storage_location: string;
  quantity_label: string | null;
  storage_note: string | null;
  added_at: string;
  expired_at: string;
  shelf_life_days: number;
  status: string;
}
