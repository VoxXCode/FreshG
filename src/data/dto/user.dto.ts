/**
 * DTO – Profil Pengguna
 *
 * Field sensitif / tidak dipakai seperti `password_hash`, `phone_number`,
 * `last_login_at`, `created_at`, `updated_at` TIDAK diambil dari server.
 */
export interface ImpactStatsDTO {
  saved_amount_idr: number;
  rescued_items: number;
  success_rate: number; // 0..1
  co2_prevented_kg: number;
  percentile_rank: number;
}

export interface UserProfileDTO {
  id: number;
  full_name: string;
  email: string;
  avatar_url: string;
  member_code: string;
  membership_tier: string;
  impact_stats: ImpactStatsDTO;
}
