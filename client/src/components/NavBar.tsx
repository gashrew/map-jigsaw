/**
 * NavBar — Dark Atlas design
 * Shared top navigation bar for switching between jigsaw maps.
 * Sits above the page-specific header controls.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";

interface MapEntry {
  path: string;
  label: string;
  flag: string;
  subtitle: string;
  available: boolean;
}

const MAPS: MapEntry[] = [
  {
    path: "/england",
    label: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    subtitle: "90 boundary areas",
    available: true,
  },
  {
    path: "/usa",
    label: "USA",
    flag: "🇺🇸",
    subtitle: "51 areas",
    available: true,
  },
  {
    path: "/europe",
    label: "Europe",
    flag: "🌍",
    subtitle: "47 countries",
    available: true,
  },
  {
    path: "/south-america",
    label: "S. America",
    flag: "🌎",
    subtitle: "14 areas",
    available: true,
  },
  {
    path: "/canada",
    label: "Canada",
    flag: "🇨🇦",
    subtitle: "13 areas",
    available: true,
  },
  {
    path: "/middle-east",
    label: "Middle East",
    flag: "🌍",
    subtitle: "17 countries",
    available: true,
  },
];

export function NavBar() {
  const [location] = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav
      style={{
        background: "#0d1829",
        borderBottom: "1px solid rgba(224,201,127,0.12)",
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
        height: 36,
        zIndex: 200,
      }}
    >
      {/* Brand mark */}
      <span
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "0.72rem",
          color: "rgba(224,201,127,0.45)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginRight: 12,
          whiteSpace: "nowrap",
        }}
      >
        Map Jigsaw
      </span>

      {/* Separator */}
      <div style={{ width: 1, height: 16, background: "rgba(58,80,112,0.6)", marginRight: 8 }} />

      {/* Map links */}
      {MAPS.map((m) => {
        const isActive = location === m.path || (m.path !== "/" && location.startsWith(m.path));
        const isHovered = hovered === m.path;

        return m.available ? (
          <Link key={m.path} href={m.path}>
            <NavItem
              flag={m.flag}
              label={m.label}
              subtitle={m.subtitle}
              isActive={isActive}
              isHovered={isHovered}
              disabled={false}
              onMouseEnter={() => setHovered(m.path)}
              onMouseLeave={() => setHovered(null)}
            />
          </Link>
        ) : (
          <NavItem
            key={m.path}
            flag={m.flag}
            label={m.label}
            subtitle={m.subtitle}
            isActive={false}
            isHovered={isHovered}
            disabled={true}
            onMouseEnter={() => setHovered(m.path)}
            onMouseLeave={() => setHovered(null)}
          />
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Coming soon badge */}
      <span
        style={{
          fontSize: "0.6rem",
          color: "#3a5070",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "Inter, sans-serif",
        }}
      >
        More maps coming soon
      </span>
    </nav>
  );
}

function NavItem({
  flag,
  label,
  subtitle,
  isActive,
  isHovered,
  disabled,
  onMouseEnter,
  onMouseLeave,
}: {
  flag: string;
  label: string;
  subtitle: string;
  isActive: boolean;
  isHovered: boolean;
  disabled: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 10px",
        height: 36,
        borderBottom: isActive
          ? "2px solid #e0c97f"
          : "2px solid transparent",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.38 : 1,
        transition: "border-color 0.15s, background 0.15s",
        background: isHovered && !disabled ? "rgba(224,201,127,0.05)" : "transparent",
        position: "relative",
      }}
    >
      <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>{flag}</span>
      <div>
        <div
          style={{
            fontSize: "0.74rem",
            fontFamily: "Inter, sans-serif",
            fontWeight: isActive ? 600 : 400,
            color: isActive ? "#e0c97f" : isHovered && !disabled ? "#c8d8e8" : "#6a8aaa",
            lineHeight: 1.2,
            transition: "color 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          {label}
          {disabled && (
            <span
              style={{
                marginLeft: 5,
                fontSize: "0.55rem",
                background: "rgba(224,201,127,0.15)",
                color: "#a89050",
                padding: "1px 5px",
                borderRadius: 8,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                verticalAlign: "middle",
              }}
            >
              soon
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "0.58rem",
            color: "#3a5070",
            fontFamily: "Inter, sans-serif",
            lineHeight: 1,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
