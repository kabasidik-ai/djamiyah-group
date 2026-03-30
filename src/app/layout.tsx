import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Groupe Djamiyah | Hôtel Maison Blanche Coyah",
  description: "Découvrez l'Hôtel Maison Blanche à Coyah, une expérience unique de confort et de sérénité signée Groupe Djamiyah.",
  openGraph: {
    title: "Groupe Djamiyah",
    description: "Hôtel Maison Blanche – Coyah",
    type: "website",
    siteName: "Groupe Djamiyah",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Groupe Djamiyah",
    description: "Hôtel Maison Blanche – Coyah",
  },
  icons: {
    icon: "/images/corporate/favicon-djamiyah.png",
    apple: "/images/corporate/favicon-djamiyah-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-white text-gray-900`}>
        <div className="flex flex-col min-h-screen">
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
