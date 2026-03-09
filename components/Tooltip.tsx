"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  maxWidth?: number;
}

interface Coords {
  top: number;
  left: number;
}

const GAP = 8;

export default function Tooltip({
  content,
  children,
  position = "top",
  maxWidth = 220,
}: TooltipProps) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = r.top - GAP;
        left = r.left + r.width / 2;
        break;
      case "bottom":
        top = r.bottom + GAP;
        left = r.left + r.width / 2;
        break;
      case "left":
        top = r.top + r.height / 2;
        left = r.left - GAP;
        break;
      case "right":
        top = r.top + r.height / 2;
        left = r.right + GAP;
        break;
    }
    setCoords({ top, left });
  }, [position]);

  const hide = useCallback(() => setCoords(null), []);

  const transformMap: Record<string, string> = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0%)",
    left: "translate(-100%, -50%)",
    right: "translate(0%, -50%)",
  };

  const arrowStyle: Record<string, React.CSSProperties> = {
    top: {
      top: "100%", left: "50%", transform: "translateX(-50%)",
      borderWidth: "5px 5px 0 5px",
      borderColor: "rgba(15,23,42,0.98) transparent transparent transparent",
    },
    bottom: {
      bottom: "100%", left: "50%", transform: "translateX(-50%)",
      borderWidth: "0 5px 5px 5px",
      borderColor: "transparent transparent rgba(15,23,42,0.98) transparent",
    },
    left: {
      left: "100%", top: "50%", transform: "translateY(-50%)",
      borderWidth: "5px 0 5px 5px",
      borderColor: "transparent transparent transparent rgba(15,23,42,0.98)",
    },
    right: {
      right: "100%", top: "50%", transform: "translateY(-50%)",
      borderWidth: "5px 5px 5px 0",
      borderColor: "transparent rgba(15,23,42,0.98) transparent transparent",
    },
  };

  const tooltip =
    coords && mounted
      ? createPortal(
          <div
            className="pointer-events-none"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: transformMap[position],
              zIndex: 9999,
              maxWidth,
            }}
          >
            <div
              className="relative px-3 py-2 text-xs leading-relaxed rounded-xl"
              style={{
                background: "rgba(15,23,42,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                backdropFilter: "blur(12px)",
                width: "max-content",
                maxWidth,
                whiteSpace: "normal",
                color: "#cbd5e1",
                textTransform: "none",
                letterSpacing: "normal",
                fontWeight: "normal",
              }}
            >
              {content}
              <span
                className="absolute border-solid"
                style={{ ...arrowStyle[position], borderStyle: "solid" }}
              />
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        ref={ref}
        className="relative inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </div>
      {tooltip}
    </>
  );
}
