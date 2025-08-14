"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("Checking API…");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
    fetch(`${base}/health`)
      .then(async (r) => setStatus(r.ok ? "API is healthy" : `API error ${r.status}`))
      .catch((e) => setStatus(`API unreachable: ${e?.message ?? e}`));
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl w-full rounded-2xl shadow p-8 border">
        <h1 className="text-2xl font-semibold mb-3">LoneStarLedger 1.3</h1>
        <p className="mb-2">
          NEXT_PUBLIC_API_BASE:{" "}
          <code>{process.env.NEXT_PUBLIC_API_BASE ?? "(not set)"}</code>
        </p>
        <p className="font-medium">{status}</p>
      </div>
    </main>
  );
}
