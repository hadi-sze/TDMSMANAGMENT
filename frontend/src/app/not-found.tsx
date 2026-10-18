import Link from "next/link";
import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main className="not-found">
      <Brand />
      <h1>This page has moved out of sight.</h1>
      <p>Let’s get you back to your workspace.</p>
      <Link href="/dashboard">Back to dashboard →</Link>
    </main>
  );
}
