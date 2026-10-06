/**
 * MAPPER – UserProfileDTO → UserProfile
 *
 * Transformasi:
 *   - member_code "FG-90214"   → "#FG-90214"
 *   - membership_tier (kode)   → label yang ramah pengguna
 *   - success_rate 0.92        → successPercent 92
 *   - impact_stats (nested)    → impact (camelCase)
 */
import type { UserProfileDTO } from '@/data/dto/user.dto';
import type { UserProfile } from '@/types/user';

const MEMBERSHIP_LABELS: Record<string, string> = {
  eco_saver: 'Member Eco-Saver 🌱',
  eco_hero:  'Member Eco-Hero 🌳',
  basic:     'Member Basic',
};

export function toUserProfile(dto: UserProfileDTO): UserProfile {
  const stats = dto.impact_stats;
  return {
    id: String(dto.id),
    name: dto.full_name,
    email: dto.email,
    avatarUrl: dto.avatar_url,
    memberId: `#${dto.member_code}`,
    membershipLabel: MEMBERSHIP_LABELS[dto.membership_tier] ?? 'Member',
    impact: {
      savedAmount: stats.saved_amount_idr,
      rescuedItems: stats.rescued_items,
      successPercent: Math.round(stats.success_rate * 100),
      co2PreventedKg: stats.co2_prevented_kg,
      topPercentile: stats.percentile_rank,
    },
  };
}
