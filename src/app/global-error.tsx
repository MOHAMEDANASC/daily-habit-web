"use client";

import { useEffect } from "react";

/** Last-resort boundary: replaces the whole document, so it brings its own <html> and styles. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", display: "grid", minHeight: "100dvh", placeItems: "center", padding: 24, textAlign: "center" }}>
        <main>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#555", marginBottom: 20 }}>An unexpected error occurred. Your data is safe. Please try again.</p>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#4f46e5", color: "white", fontSize: 16, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
