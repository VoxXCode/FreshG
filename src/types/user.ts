/**
 * Application Data – Profil Pengguna
 */
export interface ImpactStats {
  savedAmount: number;     // Rupiah
  rescuedItems: number;
  successPercent: number;  // 0..100
  co2PreventedKg: number;
  topPercentile: number;   // mis. 5 → "5% teratas"
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  memberId: string;        // mis. "#FG-90214"
  membershipLabel: string; // mis. "Member Eco-Saver 🌱"
  impact: ImpactStats;
}
