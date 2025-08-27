// app/page.tsx
"use client";

import { useState } from "react";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [researchResult, setResearchResult] = useState<string | null>(null);
  const [creative, setCreative] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setError(null);
    setCreative(null);
    setResearchResult(null);

    if (!topic) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);

    try {
      // 1) Call existing research endpoint
      const res = await fetch(`/api/research?topic=${encodeURIComponent(topic)}`);
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson?.error || "Research API failed");
      }
      const research = resJson.result;
      setResearchResult(research);

      // 2) Call creative agent with research
      const creativeRes = await fetch("/api/creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ research, topic }),
      });
      const creativeJson = await creativeRes.json();
      if (!creativeRes.ok) {
        throw new Error(creativeJson?.error || "Creative API failed");
      }
      setCreative(creativeJson);
    } catch (err: any) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-start justify-center bg-gray-50 p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Infinty — Research → Creative</h1>

        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex gap-3">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (e.g. Euro 2024)"
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleRun}
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-60"
            >
              {loading ? "Working..." : "Run"}
            </button>
          </div>

          {error && <div className="mt-4 text-red-600">{error}</div>}

          {researchResult && (
            <div className="mt-6">
              <h2 className="font-semibold">Research</h2>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-line">{researchResult}</div>
            </div>
          )}

          {creative && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Twitter */}
              <div className="col-span-1 bg-white p-4 rounded-xl shadow">
                <h3 className="font-semibold mb-2">Twitter</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{creative.twitter || "—"}</p>
              </div>

              {/* Publish button under Twitter caption */}
              <button
                onClick={async () => {
                  const res = await fetch("/api/publish", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: creative.twitter }), // user approved caption
                  });
                  const data = await res.json();
                  console.log("Publish result:", data);
                  alert(data.success ? "Tweet posted!" : "Failed: " + data.error);
                }}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Publish to X
              </button>


              {/* Instagram */}
              <div className="col-span-1 bg-white p-4 rounded-xl shadow">
                <h3 className="font-semibold mb-2">Instagram</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {creative.instagram || "—"}
                </p>
              </div>

              {/* LinkedIn */}
              <div className="col-span-1 bg-white p-4 rounded-xl shadow">
                <h3 className="font-semibold mb-2">LinkedIn</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{creative.linkedin || "—"}</p>
              </div>

              {/* Images (full width) */}
              <div className="col-span-1 md:col-span-3 mt-4">
                <h3 className="font-semibold mb-2">Generated Image(s)</h3>
                {creative.images?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {creative.images.map((img: any, idx: number) => {
                      // image object: { filename, b64, mime }
                      const src = `data:${img.mime || "image/png"};base64,${img.b64}`;
                      return (
                        <div key={idx} className="bg-white p-3 rounded-xl shadow">
                          <img src={src} alt={`generated-${idx}`} className="w-full h-64 object-cover rounded-md" />
                          <div className="mt-2 text-xs text-gray-500">{img.filename}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500">No image returned.</div>
                )}
              </div>

              {/* Debug / Raw */}
              <div className="col-span-1 md:col-span-3 mt-4 bg-gray-50 p-4 rounded-lg">
                <details>
                  <summary className="cursor-pointer font-medium">Raw response</summary>
                  <pre className="mt-2 text-xs text-gray-700 overflow-auto">{JSON.stringify(creative, null, 2)}</pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
