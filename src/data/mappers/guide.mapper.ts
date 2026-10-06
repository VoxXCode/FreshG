/**
 * MAPPER – GuideDTO → Guide
 */
import type { GuideDTO } from '@/data/dto/guide.dto';
import type { Guide, GuideTheme } from '@/types/guide';

function toTheme(value: string): GuideTheme {
  return value === 'amber' ? 'amber' : 'blue';
}

export function toGuide(dto: GuideDTO): Guide {
  return {
    id: String(dto.id),
    tag: dto.category_tag,
    readTimeMinutes: dto.read_time_minutes,
    title: dto.title,
    description: dto.content,
    tipLabel: dto.tip_label,
    tipText: dto.tip_text,
    tipIcon: dto.tip_icon,
    icon: dto.icon_name,
    theme: toTheme(dto.color_theme),
    reviewedBy: dto.reviewer_name,
  };
}

export function toGuideList(dtos: GuideDTO[]): Guide[] {
  return dtos.map(toGuide);
}
