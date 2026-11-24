export interface ImpactStatsDTO {
  saved_amount_idr: number;
  rescued_items: number;
  success_rate: number;
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
