"use client";

import { useEffect, useState, FormEvent } from "react";

type Article = { id: number; title: string; body: string; created_at: string };

export default function Home() {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const [status, setStatus] = useState("Checking API...");
  const [list, setList] = useState<Article[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function load() {
    try {
      const health = await fetch(`${base}/health`, { cache: "no-store" });
      setStatus(health.ok ? "API is healthy" : `API error ${health.status}`);
      const a = await fetch(`${base}/v1/articles`, { cache: "no-store" });
      if (a.ok) setList(await a.json());
    } catch (err: any) {
      setStatus(`API unreachable: ${err?.message ?? String(err)}`);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const r = await fetch(`${base}/v1/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    if (r.ok) {
      setTitle("");
      setBody("");
      await load();
    }
  }

  return (
    <main className="min-h-screen p-6 flex flex-col gap-8 items-center">
      <div className="w-full max-w-2xl rounded-2xl shadow p-6 border">
        <h1 className="text-2xl font-semibold mb-3">LoneStarLedger 1.3</h1>
        <p className="mb-4">
          NEXT_PUBLIC_API_BASE: <code>{base || "(not set)"}</code>
        </p>
        <p className="font-medium mb-6">{status}</p>

        <form onSubmit={submit} className="flex flex-col gap-3 mb-8">
          <input
            className="border rounded-lg p-3"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="border rounded-lg p-3 h-32"
            placeholder="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button className="rounded-xl border px-4 py-2 shadow w-fit">Post</button>
        </form>

        <div className="space-y-4">
          {list.map((a) => (
            <div key={a.id} className="border rounded-xl p-4">
              <div className="font-semibold">{a.title}</div>
              <div className="text-sm opacity-70">
                {new Date(a.created_at).toLocaleString()}
              </div>
              <p className="mt-2 whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
          {list.length === 0 && <div className="opacity-70">No posts yet</div>}
        </div>
      </div>
    </main>
  );
}
