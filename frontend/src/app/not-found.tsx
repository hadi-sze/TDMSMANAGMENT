import Link from "next/link";
import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main className="not-found">
      <Brand />
      <h1>این صفحه پیدا نشد.</h1>
      <p>به فضای کاری خود بازگردید.</p>
      <Link href="/dashboard">بازگشت به داشبورد</Link>
    </main>
  );
}
