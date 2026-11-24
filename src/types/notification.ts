/**
 * Types untuk Push Notification (Week 11: Sprint 09 - PRESIDENTKU / FreshG)
 */

export interface NotificationPayloadData {
  screen?: string;
  id?: string | number;
  type?: 'expiry_reminder' | 'recipe_recommendation' | 'todo_reminder' | 'custom';
  title?: string;
  body?: string;
  [key: string]: unknown;
}

export interface NotificationPayload {
  to: string;
  title: string;
  body: string;
  sound?: string;
  badge?: number;
  data?: NotificationPayloadData;
}

export interface PushTokenRegistrationResult {
  token: string | null;
  status: 'granted' | 'denied' | 'undetermined' | 'simulator_fallback';
  isDevice: boolean;
  message?: string;
}

export interface NotificationLogItem {
  id: string;
  timestamp: string;
  title: string;
  body: string;
  data?: NotificationPayloadData;
  source: 'received_foreground' | 'response_tapped' | 'scheduled_local' | 'sent_push';
}
