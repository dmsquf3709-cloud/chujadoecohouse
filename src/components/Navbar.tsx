import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-base sm:text-xl font-bold text-blue-900 whitespace-nowrap"
        >
          추자도 에코하우스
        </Link>

        <div className="flex items-center gap-3 sm:gap-6 md:gap-10 text-sm sm:text-base font-medium text-gray-700 whitespace-nowrap">
          <Link
            href="/about"
            className="hover:text-blue-600 transition-colors"
          >
            펜션 소개
          </Link>

          <Link
            href="/location"
            className="hover:text-blue-600 transition-colors"
          >
            오시는 길
          </Link>

          <Link
            href="/reservations"
            className="hover:text-blue-600 transition-colors"
          >
            객실 예약
          </Link>
        </div>
      </div>
    </nav>
  );
}