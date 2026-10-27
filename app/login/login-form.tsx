"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const roles = [
  { name: "Admin", destination: "/admin/orders", description: "Manage orders and assignments" },
  { name: "Technician", destination: "/technician/jobs", description: "Complete assigned field jobs" },
  { name: "Manager", destination: "/manager/reviews", description: "Review jobs and operations" }
];

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState("Admin");

  function continueAsRole() {
    const selected = roles.find((item) => item.name === role);
    router.push(selected?.destination ?? "/admin/orders");
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sea">Demo access</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Enter your workspace</h1>
      <p className="mt-3 leading-6 text-slate-500">
        Choose a role to preview the assessment workflow. Real authentication will be added only if it improves the final demonstration.
      </p>

      <label className="mt-8 block text-sm font-semibold text-ink" htmlFor="role">Continue as</label>
      <select
        id="role"
        value={role}
        onChange={(event) => setRole(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none ring-sea focus:ring-2"
      >
        {roles.map((item) => <option key={item.name}>{item.name}</option>)}
      </select>

      <p className="mt-3 text-sm text-slate-500">{roles.find((item) => item.name === role)?.description}</p>

      <button onClick={continueAsRole} className="mt-8 w-full rounded-xl bg-ink px-4 py-3.5 font-semibold text-white transition hover:bg-slate-800">
        Continue to workspace
      </button>
    </div>
  );
}
