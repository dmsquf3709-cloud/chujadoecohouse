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
      <div className="max-w-[1500px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link href="/admin/reservations" className="font-black tracking-tighter">
          CHUJADO ADMIN
        </Link>

        <nav className="flex items-center gap-2">
          {menus.map((menu) => {
            const active = pathname.startsWith(menu.href);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`px-4 py-2 text-sm font-bold ${
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