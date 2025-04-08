import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { NotificationsProvider } from './context/NotificationsContext';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'SCHED-NU',
  description: 'A scheduling system for NU Baliwag',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900" suppressHydrationWarning={true}>
        <ThemeProvider>
          <SidebarProvider>
            <NotificationsProvider>
              {children}
            </NotificationsProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
