import Svg, { Path } from "react-native-svg";

// Line icon set — 1.7 stroke, rounded. Matches the Prevail prototype.
const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5M5.5 9v11h13V9",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  journal: "M5 4h11a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2ZM9 9h6M9 13h4",
  book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5ZM4 20.5A2.5 2.5 0 0 0 6.5 18H20",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.2A1.6 1.6 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13H3a2 2 0 0 1 0-4h.2A1.6 1.6 0 0 0 4.7 7L4.6 7a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6V4a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.4 1H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  plus: "M12 5v14M5 12h14",
  right: "M9 6l6 6-6 6",
  left: "M15 6l-6 6 6 6",
  down: "M6 9l6 6 6-6",
  check: "M5 12.5l4.5 4.5L19 7",
  heart: "M12 20.5l-1.5-1.3C5.4 14.6 2.5 12 2.5 8.6 2.5 6 4.5 4 7 4c1.7 0 3.3.9 4.2 2.3l.8 1.2.8-1.2A5 5 0 0 1 17 4c2.5 0 4.5 2 4.5 4.6 0 3.4-2.9 6-8 10.6L12 20.5Z",
  share: "M16 6l-4-4-4 4M12 2v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
  calendar: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  flame: "M12 22c3.9 0 6.5-2.4 6.5-6 0-2.1-1-3.7-2.3-5.2-.3 1.2-1 2-1.8 2.2.3-2.2-.6-4.7-3-6.5C9.6 2.4 8 4.4 8 7c0 1.3.4 2 .8 2.7C7.3 9.4 6 8.6 5.8 7 4.6 8.6 5.5 16 12 22Z",
  note: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  play: "M7 4.5v15l13-7.5-13-7.5Z",
  pause: "M8 5v14M16 5v14",
  x: "M6 6l12 12M18 6L6 18",
  edit: "M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17v3ZM13.5 6.5l3 3",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  lock: "M6 10V8a6 6 0 1 1 12 0v2M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z",
  download: "M12 3v12M7 10l5 5 5-5M5 21h14",
  archive: "M3 7h18M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M4 7l1.5-3h13L20 7M10 12h4",
  trash: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7",
  filter: "M3 5h18M6 12h12M10 19h4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0",
  pray: "M12 3c-1 2.5-2.5 4-4 5.5S5 12 5 15a7 7 0 0 0 14 0c0-3-1.5-5-3-6.5S13 5.5 12 3Z",
  quote: "M9 7H5v6h4l-2 4h2l2-4V7ZM19 7h-4v6h4l-2 4h2l2-4V7Z",
  cross: "M10 3h4v5h5v4h-5v9h-4v-9H5V8h5V3Z",
  timer: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 9v4l2.5 2M9 2h6",
};

const FILLED = ["play", "flame", "cross"];

interface IconProps {
  name: keyof typeof PATHS | string;
  size?: number;
  color?: string;
  sw?: number;
  filled?: boolean;
}

export function Icon({ name, size = 22, color = "currentColor", sw = 1.7, filled }: IconProps) {
  const d = PATHS[name] || "";
  const isFilled = filled ?? FILLED.includes(name);
  const segments = d.split(" M").map((seg, i) => (i ? "M" + seg : seg));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {segments.map((seg, i) => (
        <Path
          key={i}
          d={seg}
          fill={isFilled ? color : "none"}
          stroke={isFilled ? "none" : color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
