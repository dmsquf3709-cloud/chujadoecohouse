"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { href: "/admin/reservations", label: "예약관리" },
  { href: "/admin/inventory", label: "재고관리" },
  { href: "/admin/revenue", label: "매출통계" },
];

export default function AdminNav() {
  const pathname = usePathname();

  if (pathname === "/admin/login") return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 md:px-10 h-14 sm:h-16 flex items-center justify-between">

        <Link
          href="/admin/reservations"
          className="text-sm sm:text-base font-black tracking-tight whitespace-nowrap"
        >
          CHUJADO ADMIN
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
          {menus.map((menu) => {
            const active = pathname.startsWith(menu.href);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:text-slate-950"
                }`}
              >
                {menu.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}