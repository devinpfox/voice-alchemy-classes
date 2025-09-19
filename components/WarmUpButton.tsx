import React, { useEffect, useState } from "react";

export default function WarmupButton() {
  const [open, setOpen] = useState(false);

  // Close with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* FAB (left) */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open warm-ups"
        style={{
          position: "fixed",
          left: 20,
          bottom: 20,
          width: "150px",
          borderRadius: 100,
          border: "none",
          cursor: "pointer",
          zIndex: 10001,
          background: "#D9B25F",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          display: "grid",
          placeItems: "center",
          fontSize: 22,
        }}
      >
        Warm Ups
      </button>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        style={{
          position: "fixed",
          inset: 0,
          background: open ? "rgba(0,0,0,0.35)" : "transparent",
          transition: "background .18s ease",
          pointerEvents: open ? "auto" : "none",
          zIndex: 10000,
        }}
      />

      {/* Slide-out drawer (left) */}
      <aside
        role="dialog"
        aria-label="Warm-up Guide"
        aria-hidden={!open}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: "min(520px, 92vw)",
          background: "#111318",
          color: "white",
          transform: `translateX(${open ? "0%" : "-104%"})`,
          transition: "transform .22s ease",
          boxShadow: "4px 0 32px rgba(0,0,0,0.45)",
          zIndex: 10002,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            background:
              "linear-gradient(to right, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#49d17c",
              }}
            />
            <strong style={{ fontSize: 14 }}>Warm‑up Guide</strong>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            style={{
              background: "transparent",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.18)",
              padding: "4px 10px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "14px 16px 32px",
            overflowY: "auto",
            lineHeight: 1.35,
            background: "#171229"
          }}
        >
          {/* Physical warm-ups */}
          <h3 style={{ fontSize: 16, margin: "6px 0 8px", fontWeight: 700 }}>
            Physical warm‑ups
          </h3>
          <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
            <li style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>Adjust your posture</div>
              <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: "disc" }}>
                <li>Feet flat and even</li>
                <li>If seated, back is off the chair</li>
                <li>Spine straight, supported slightly by the core muscles</li>
                <li>Tuck chin (parallel to the floor), relax shoulders down the back</li>
              </ul>
            </li>

            <li style={{ marginBottom: 10 }}>
              Breath in and out belly → chest × 10
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                (at least 5 seconds for each inhale/exhale)
              </div>
            </li>

            <li style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>Head up/downs (3 each)</div>
              <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: "disc" }}>
                <li>Exhaling, drop head, elongating the back of the spine, inhale center the head</li>
                <li>Exhaling, lift chin, open the top of the chest, inhale center the head, again</li>
              </ul>
            </li>

            <li style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>
                Turn the head at the neck by following the eyes in either direction (3 each)
              </div>
              <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: "disc" }}>
                <li>Exhaling, turn to one side, inhale return to center</li>
                <li>Repeat on the opposite side</li>
              </ul>
            </li>

            <li style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>
                Drop ear to shoulder on both sides (3 × each)
              </div>
              <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: "disc" }}>
                <li>Exhaling, drop head’s entire weight to one side, stretching side neck and shoulder</li>
                <li>Inhaling, return head to upright center posture</li>
              </ul>
            </li>

            <li style={{ marginBottom: 10 }}>
              Head circles 5 seconds in both directions × 3 (total 6 times)
            </li>

            <li style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>Shoulder circles</div>
              <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: "disc" }}>
                <li>Back × 5</li>
                <li>Forward × 5</li>
                <li>Inhale to lift and squeeze shoulders, slowly exhale and release the shoulders down</li>
              </ul>
            </li>

            <li style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>
                Facial muscles warm‑ups (for 5 seconds × 3 each)
              </div>
              <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: "disc" }}>
                <li>Make face as small as possible (squish)</li>
                <li>Make face as big as possible (expand)</li>
                <li>Squish face to either side, releasing the jaw muscles</li>
                <li>Circle the facial muscles in either direction to massage them internally</li>
              </ul>
            </li>
          </ul>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.08)",
              margin: "16px 0",
            }}
          />

          {/* Vocal warm-ups */}
          <h3 style={{ fontSize: 16, margin: "6px 0 8px", fontWeight: 700 }}>
            Vocal warm‑ups
          </h3>
          <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
            <li style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>Most annoying sound in the world</div>
              <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: "disc" }}>
                <li>
                  Up (head voice) → down (chest voice) and down (chest voice) → up (head voice) × 5 each way,
                  conscious of transitions and even volume throughout. Here’s an example sound to emulate.
                </li>
              </ul>
            </li>

            <li style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>Ear training</div>
              <ul style={{ marginTop: 6, paddingLeft: 18, listStyle: "disc" }}>
                <li>
                  Use a tuning app on your phone or computer, finding a comfortable starting note (low or high in your natural range) to hear and then match consecutive whole notes in an octave to what you hear by singing them as an “Aah” sound for at least 2 seconds each or until the app indicates that you’ve hit the correct note.
                </li>
                <br />
                <li>
                Use our Perfect Pitch tool (button in the bottom right) to practice ear training. It plays reference tones and listens to your voice in real time, helping you match each note accurately. With regular use, this will become easier over time.
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
