/**
 * Shared TypeScript types — Frontend
 * Mirrors the API response shape from the evaluation service.
 */

export type NotificationType = "Event" | "Result" | "Placement";

export interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string; // "YYYY-MM-DD HH:mm:ss"
}

export interface ApiResponse {
  notifications: Notification[];
}

export interface ScoredNotification {
  notification: Notification;
  score: number;
  rank: number;
}

export type FilterType = NotificationType | "All";

export interface FetchParams {
  page?: number;
  limit?: number;
  notification_type?: string;
}
