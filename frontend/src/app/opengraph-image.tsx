import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function asDataUrl(file: string, mime: string) {
  const data = await readFile(path.join(process.cwd(), "public/images", file));
  return `data:${mime};base64,${data.toString("base64")}`;
}

/** Image de partage (OpenGraph / Twitter) générée au build à partir des visuels officiels. */
export default async function OpengraphImage() {
  const [background, logo] = await Promise.all([
    asDataUrl("hero-port.jpg", "image/jpeg"),
    asDataUrl("logo.png", "image/png"),
  ]);

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={background}
        alt=""
        width={1200}
        height={630}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          color: "#ffffff",
          fontFamily: "sans-serif",
          background:
            "linear-gradient(120deg, rgba(4,16,43,0.95) 0%, rgba(4,16,43,0.8) 60%, rgba(13,63,166,0.55) 100%)",
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              borderRadius: 20,
              padding: "16px 28px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" width={340} height={122} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, maxWidth: 950 }}>{siteConfig.tagline}</div>
          <div style={{ marginTop: 24, fontSize: 28, color: "rgba(255,255,255,0.8)" }}>
            Port & aéroport de Pointe-Noire · Import · Export
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            color: "#f0d688",
          }}
        >
          <span>Agrément CEMAC N° {siteConfig.cemacAgreement}</span>
          <span>{siteConfig.phoneDisplay}</span>
        </div>
      </div>
    </div>,
    size,
  );
}
