/**
 * Shared TypeScript types for the Campus Notifications System.
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
  rank?: number;
}
