/**
 * DTO – Panduan Penyimpanan
 *
 * Field server yang tidak dipakai (`slug`, `view_count`, `published_at`)
 * tidak dimasukkan.
 */
export interface GuideDTO {
  id: number;
  category_tag: string;
  read_time_minutes: number;
  title: string;
  content: string;
  tip_label: string;
  tip_text: string;
  tip_icon: string;
  icon_name: string;
  color_theme: string;
  reviewer_name: string;
}
