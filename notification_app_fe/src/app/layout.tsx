import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import { ReadStateProvider } from "@/context/ReadStateContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusNotify — Campus Notifications System",
  description:
    "A real-time campus notification platform showing placement drives, exam results, and events. Built for Project Campus Hiring Evaluation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ThemeRegistry>
          <ReadStateProvider>
            {children}
          </ReadStateProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
