export interface ImpactStats {
  savedAmount: number;
  rescuedItems: number;
  successPercent: number;
  co2PreventedKg: number;
  topPercentile: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  memberId: string;
  membershipLabel: string;
  impact: ImpactStats;
}
