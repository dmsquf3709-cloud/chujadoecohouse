import { redirect } from 'next/navigation';

export default function HomePage() {
  // 사용자가 접속하면 바로 /about 페이지로 보내버립니다.
  redirect('/about');
}

