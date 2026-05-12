"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");

  function handleLogin() {
    if (password === "5942") {
      localStorage.setItem("chujado_admin_login", "true");
      router.push("/admin");
      return;
    }

    alert("비밀번호가 틀렸습니다.");
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 font-sans">
      <div className="w-full max-w-[420px] bg-white p-8 md:p-10 shadow-2xl">
        <p className="text-blue-700 tracking-[0.42em] uppercase text-sm font-bold font-mono mb-5">
          Admin
        </p>

        <h1 className="text-4xl font-black tracking-tighter mb-8">
          사장님 로그인
        </h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          placeholder="비밀번호 입력"
          className="w-full h-13 px-4 py-4 border border-slate-200 outline-none text-sm mb-4"
        />

        <button
          type="button"
          onClick={handleLogin}
          className="w-full py-4 bg-slate-950 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          로그인
        </button>
      </div>
    </main>
  );
}