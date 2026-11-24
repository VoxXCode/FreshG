export type GuideTheme = 'blue' | 'amber';

export interface Guide {
  id: string;
  tag: string;
  readTimeMinutes: number;
  title: string;
  description: string;
  tipLabel: string;
  tipText: string;
  tipIcon: string;
  icon: string;
  theme: GuideTheme;
  reviewedBy: string;
}
