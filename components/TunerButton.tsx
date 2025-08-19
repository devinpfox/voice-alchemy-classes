import React, { useEffect, useState } from "react";

export default function TunerButtont() {
  const [open, setOpen] = useState(false);

  // Close with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open tuner"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: "9999px",
          border: "none",
          cursor: "pointer",
          zIndex: 10000,
          background: "#D9B25F", // tweak to match your palette
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          display: "grid",
          placeItems: "center",
          fontSize: 22,
        }}
      >
        🎵
      </button>

      {/* Chat-like popover */}
      <div
        aria-hidden={!open}
        style={{
          position: "fixed",
          right: 20,
          bottom: 84, // sits just above the button
          width: "min(380px, 92vw)",
          height: "min(560px, 75vh)",
          background: "#111318", // or "#fff" if you prefer light
          color: "white",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          zIndex: 10000,
          transform: `translateY(${open ? 0 : 16}px)`,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .18s ease, transform .18s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 10px",
            background:
              "linear-gradient(to right, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#49d17c",
              }}
            />
            <strong style={{ fontSize: 13 }}>Chromatic Tuner</strong>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close tuner"
              style={{
                background: "transparent",
                color: "inherit",
                border: "1px solid rgba(255,255,255,0.18)",
                padding: "4px 8px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ width: "100%", height: "100%" }}>
          <iframe
            title="Tuner"
            src="/chromatic-tuner/tune1.html"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
      </div>

      {/* Optional: click-away to close (only when open) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999, // sits below the widget (10000) but above app
            background: "transparent",
          }}
        />
      )}
    </>
  );
}
