import { useEffect, useId, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

/**
 * ZATCA Phase-1 QR rendered as a crisp PNG.
 * Payload is Base64 TLV (not a URL) — phone cameras won't "open a link";
 * ZATCA / e-invoice reader apps decode the seller, VAT, and amounts.
 */
export function ZatcaQrCode({
  value,
  size = 128,
}: {
  value: string;
  /** Display size in CSS pixels */
  size?: number;
}) {
  const reactId = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  // Render QR at higher resolution for sharp modules when printed/scanned
  const renderSize = Math.max(size * 2, 256);

  useEffect(() => {
    if (!value) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const paint = () => {
      if (cancelled) return;
      const canvas = hostRef.current?.querySelector("canvas");
      if (!canvas) {
        if (attempts++ < 10) {
          requestAnimationFrame(paint);
        }
        return;
      }
      try {
        setSrc(canvas.toDataURL("image/png"));
      } catch {
        setSrc(null);
      }
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(paint);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [value, renderSize]);

  if (!value) return null;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
        background: "#fff",
      }}
    >
      {/*
        Keep the canvas in-flow (not off-screen). Some browsers skip painting
        canvases at left:-9999, which left the QR empty / unscannable.
      */}
      <div
        ref={hostRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <QRCodeCanvas
          id={`zatca-qr-${reactId}`}
          value={value}
          size={renderSize}
          level="M"
          includeMargin
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      {src ? (
        <img
          src={src}
          width={size}
          height={size}
          alt="ZATCA QR"
          data-zatca-qr
          style={{
            display: "block",
            width: size,
            height: size,
            background: "#fff",
          }}
        />
      ) : (
        <QRCodeCanvas
          value={value}
          size={size}
          level="M"
          includeMargin
          bgColor="#ffffff"
          fgColor="#000000"
        />
      )}
    </div>
  );
}
