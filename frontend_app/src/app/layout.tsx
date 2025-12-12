import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "SimplonJob - Smart Application Tracker",
  description: "Streamline your job search, track applications, and land your dream job with SimplonJob's intelligent dashboard.",
  icons: {
    icon: "/simplon_logo.png",
  },
};

import { LanguageProvider } from "@/components/LanguageProvider";

import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'blockButton',
        },
        variables: {
          colorPrimary: '#0a66c2', // LinkedIn Blue
          colorTextOnPrimaryBackground: 'white',
          borderRadius: '0.5rem',
          fontFamily: 'inherit',
        },
        elements: {
          card: {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e0e0e0',
          },
          formButtonPrimary: {
            fontSize: '14px',
            textTransform: 'none',
            backgroundColor: '#0a66c2',
            '&:hover': {
              backgroundColor: '#004182',
            }
          }
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <LanguageProvider>
            <ThemeProvider defaultTheme="light" storageKey="tre-theme">
              {children}
            </ThemeProvider>
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
