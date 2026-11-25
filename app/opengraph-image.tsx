import { ImageResponse } from "next/og";

export const alt = "Velatum: see how a stalker would find your home from your run files, then make the attack miss";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// IDENTITY.md palette (D11 museum). ImageResponse cannot read CSS variables, so the key
// block hexes are written here directly.
const BONE = "#f4f1ea";
const INK = "#191713";
const GOLD = "#7a6220";
const HAIRLINE = "#ad8c3a";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BONE, padding: 48 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `2px solid ${HAIRLINE}`,
            padding: 56,
            color: INK,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <svg width="88" height="88" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="21" fill="none" stroke={HAIRLINE} strokeWidth="3" strokeDasharray="5 3.5" />
              <path d="M32 21 L43 31 L43 43 L21 43 L21 31 Z" fill={GOLD} />
              <path d="M3 61 L10 54 L13 56 L17 49" fill="none" stroke={INK} strokeWidth="3.5" />
              <path d="M47 15 L51 9 L55 11 L61 3" fill="none" stroke={INK} strokeWidth="3.5" />
            </svg>
            <div style={{ fontSize: 76, fontFamily: "serif", letterSpacing: 2 }}>Velatum</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 50, fontFamily: "serif", lineHeight: 1.1, maxWidth: 940 }}>
              Does your privacy zone actually hide your front door?
            </div>
            <div style={{ fontSize: 26, color: GOLD, letterSpacing: 4, textTransform: "uppercase" }}>
              Two attacks, run in your browser, measured in meters
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
