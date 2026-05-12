import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar"; // 상단바 불러오기
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "추자도 에코하우스 | 통합 예약",
  description: "추자도 에코하우스 객실 예약 및 관리자 시스템"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={cn("min-h-dvh antialiased")}>
        {/* 모든 페이지 상단에 메뉴바가 나오게 합니다 */}
        <Navbar />
        {/* 상단바 높이만큼 여백(pt-16)을 줘서 내용이 가려지지 않게 합니다 */}
        <main className="pt-16">
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}

