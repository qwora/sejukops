import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6 py-12">
      <div className="w-full max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 font-semibold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">S</span>
          Sejuk Sejuk
        </Link>
        <LoginForm />
      </div>
    </main>
  );
}
