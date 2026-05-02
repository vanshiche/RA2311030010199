import { redirect } from "next/navigation";

/**
 * Root page — redirects to /notifications (All Notifications page).
 */
export default function Home() {
  redirect("/notifications");
}
