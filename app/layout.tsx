import type { Metadata } from "next";
import "./globals.css";
import { clinicConfig } from "@/clinic.config";

const SITE_URL = "https://aya-medicare.vercel.app";
const TITLE = "MediCare – Clinic Appointment Booking System";
const DESCRIPTION =
  "Online clinic appointment booking: patients pick an available time slot in seconds, and the doctor manages working hours and bookings from a secure dashboard.";
const IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  title: `${clinicConfig.clinicName} | حجز المواعيد`,
  description: DESCRIPTION,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="MediCare" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="627" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={IMAGE} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}