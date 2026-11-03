import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationWrapper from "../components/notifications/NotificationWrapper";
import AppGuard from "../components/AppGuard";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "SANEM — Gerenciamento de Doações",
  description: "Gestão de doações, estoque e atendimento beneficente.",
  charset: "utf-8",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NotificationWrapper>
          <AppGuard>{children}</AppGuard>
        </NotificationWrapper>
      </body>
    </html>
  );
}
