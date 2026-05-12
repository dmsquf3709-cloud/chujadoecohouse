# 추자도 에코하우스 통합 예약 시스템 (Next.js)

## 기술 스택
- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn 스타일 UI 컴포넌트 (Radix 기반 최소 구성)
- Swiper (객실 사진 슬라이더)
- Supabase (reservations/inventory 저장, 관리자 조회)

## 환경변수
`.env.local`을 만들고 아래 값을 채우세요(절대 git에 커밋하지 마세요).

```
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=...
NEXT_PUBLIC_GOOGLE_SHEETS_ID=...

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

ADMIN_PASSWORD=5942
```

## Supabase 테이블 생성
`supabase/schema.sql`을 Supabase SQL Editor에서 실행하세요.

## 실행
패키지 설치 후 실행합니다.

```
npm install
npm run dev
```

## 주요 경로
- `/reserve`: 객실 예약(실시간 합산, 픽업 조건부 필드)
- `/admin/login`: 비밀번호 로그인
- `/admin/inventory`: 재고 매트릭스(On/Off/Sold 토글)
- `/admin/reservations`: 예약 리스트
- `/admin/revenue`: 일별 매출 차트

