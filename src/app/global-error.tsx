"use client";

import { resolveSiteBrand } from "@/lib/site-brand";

export default function GlobalError({ reset }: { reset: () => void }) {
  const brand = resolveSiteBrand();

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#f4f0e7",
          color: "#252923",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "1.5rem",
          }}
        >
          <section style={{ maxWidth: "34rem", textAlign: "center" }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "2.5rem" }}>
              {brand.name} is resting
            </h1>
            <p style={{ lineHeight: 1.7 }}>
              The application could not load. Please try the journey again.
            </p>
            <button
              onClick={reset}
              style={{
                border: 0,
                borderRadius: "0.75rem",
                background: "#657a64",
                color: "white",
                padding: "0.8rem 1.2rem",
                fontWeight: 700,
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
