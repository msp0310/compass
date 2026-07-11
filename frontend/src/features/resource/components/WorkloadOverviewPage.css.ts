import { style } from "@vanilla-extract/css";

export const page = style({
  display: "grid",
  gap: 16,
  padding: "18px 20px 28px",
});

export const header = style({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
});

export const heading = style({
  margin: 0,
  color: "#172238",
  fontSize: 22,
  letterSpacing: 0,
});

export const description = style({
  display: "block",
  marginTop: 4,
  color: "#69778d",
  fontSize: 12,
  fontWeight: 700,
});

export const segmented = style({
  display: "inline-flex",
  height: 34,
  padding: 3,
  border: "1px solid #d6e0ee",
  borderRadius: 7,
  background: "#f4f7fb",
});

export const segment = style({
  minWidth: 82,
  border: 0,
  borderRadius: 5,
  color: "#506078",
  background: "transparent",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
});

export const segmentActive = style({
  color: "#174dbd",
  background: "#fff",
  boxShadow: "0 1px 4px rgba(35, 56, 91, 0.12)",
});

export const summary = style({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
});

export const summaryItem = style({
  minHeight: 72,
  border: "1px solid #dce4ef",
  borderRadius: 7,
  background: "#fff",
  padding: "12px 14px",
});

export const summaryLabel = style({
  display: "block",
  color: "#69778d",
  fontSize: 11,
  fontWeight: 800,
});

export const summaryValue = style({
  display: "block",
  marginTop: 4,
  color: "#172238",
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: 0,
});

export const controls = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  borderTop: "1px solid #dfe6ef",
  borderBottom: "1px solid #dfe6ef",
  padding: "9px 0",
});

export const select = style({
  width: 220,
  height: 34,
  border: "1px solid #d5dfed",
  borderRadius: 6,
  color: "#31415a",
  background: "#fff",
  padding: "0 10px",
  fontSize: 12,
  fontWeight: 700,
});

export const pager = style({
  display: "flex",
  alignItems: "center",
  gap: 6,
});

export const pagerButton = style({
  display: "grid",
  width: 32,
  height: 32,
  placeItems: "center",
  border: "1px solid #d5dfed",
  borderRadius: 6,
  color: "#40516b",
  background: "#fff",
  cursor: "pointer",
  selectors: { "&:disabled": { cursor: "default", opacity: 0.35 } },
});

export const pagerIcon = style({ width: 15, height: 15 });

export const period = style({
  minWidth: 154,
  color: "#53627a",
  fontSize: 11,
  fontWeight: 800,
  textAlign: "center",
});

export const gridScroll = style({
  overflow: "auto",
  border: "1px solid #dce4ef",
  borderRadius: 7,
  background: "#fff",
});

export const grid = style({
  display: "grid",
  minWidth: 980,
});

export const cell = style({
  minHeight: 58,
  borderRight: "1px solid #e4eaf2",
  borderBottom: "1px solid #e4eaf2",
  padding: "9px 10px",
});

export const head = style({
  minHeight: 44,
  color: "#5f6e84",
  background: "#f7f9fc",
  fontSize: 11,
  fontWeight: 900,
});

export const entityCell = style({
  position: "sticky",
  left: 0,
  zIndex: 2,
  display: "flex",
  minWidth: 0,
  alignItems: "center",
  gap: 9,
  background: "#fff",
});

export const entityText = style({ minWidth: 0 });
export const entityName = style({
  display: "block",
  overflow: "hidden",
  color: "#25334a",
  fontSize: 12,
  fontWeight: 900,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
export const entityMeta = style({
  display: "block",
  marginTop: 2,
  color: "#7b8799",
  fontSize: 10,
  fontWeight: 700,
});

export const weekCell = style({
  display: "grid",
  alignContent: "start",
  gap: 5,
  background: "#fff",
});

export const loadLine = style({ display: "flex", alignItems: "baseline", gap: 5 });
export const loadValue = style({ color: "#263750", fontSize: 13, fontWeight: 900 });
export const loadHours = style({ color: "#778399", fontSize: 10, fontWeight: 700 });
export const loadTrack = style({ height: 4, overflow: "hidden", borderRadius: 999, background: "#e8eef6" });
export const loadBar = style({ height: "100%", borderRadius: 999, background: "#2e6be6" });
export const loadWarning = style({ background: "#e6a229" });
export const loadDanger = style({ background: "#e05c4f" });

export const projectLinks = style({ display: "flex", minWidth: 0, gap: 4, overflow: "hidden" });
export const projectLink = style({
  overflow: "hidden",
  maxWidth: 112,
  border: 0,
  color: "#2458c5",
  background: "transparent",
  padding: 0,
  fontSize: 9,
  fontWeight: 800,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  cursor: "pointer",
});

export const teamButton = style({
  border: 0,
  color: "#25334a",
  background: "transparent",
  padding: 0,
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  textAlign: "left",
});

export const empty = style({ padding: 32, color: "#728097", fontSize: 12, fontWeight: 700, textAlign: "center" });

