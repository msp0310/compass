import { globalStyle, style, styleVariants } from "@vanilla-extract/css";

export const teamView = style({
  display: "grid",
  gap: 14,
  borderTop: "1px solid #dce4ef",
  paddingTop: 14,
});
export const toolbar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
});
export const datePicker = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#68778e",
  fontSize: 10,
  fontWeight: 800,
});
export const toolbarActions = style({ display: "flex", alignItems: "center", gap: 8 });
export const dateNavigation = style({
  display: "inline-flex",
  height: 34,
  alignItems: "center",
  overflow: "hidden",
  border: "1px solid #cdd8e6",
  borderRadius: 6,
  background: "#fff",
});
export const remindButton = style({
  display: "inline-flex",
  height: 34,
  alignItems: "center",
  gap: 5,
  border: "1px solid #abc1ef",
  borderRadius: 6,
  color: "#2057c6",
  background: "#f2f6ff",
  padding: "0 10px",
  fontSize: 9,
  fontWeight: 900,
  cursor: "pointer",
  selectors: { "&:disabled": { cursor: "default", opacity: 0.5 } },
});
export const summaryGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
});
export const summaryCard = style({
  display: "flex",
  minHeight: 78,
  alignItems: "center",
  gap: 12,
  border: "1px solid #dbe3ee",
  borderRadius: 7,
  background: "#fff",
  padding: "12px 14px",
});
export const summaryAccents = styleVariants({
  blue: { borderLeft: "3px solid #2d68e8" },
  gray: { borderLeft: "3px solid #9aa7b8" },
  green: { borderLeft: "3px solid #19a974" },
  orange: { borderLeft: "3px solid #e6962c" },
});
export const tableWrap = style({
  minWidth: 0,
  overflow: "auto",
  border: "1px solid #dce4ef",
  borderRadius: 7,
  background: "#fff",
});
export const table = style({
  width: "100%",
  minWidth: 900,
  borderCollapse: "collapse",
  tableLayout: "fixed",
  color: "#33435b",
  fontSize: 10,
});
export const missingRow = style({ background: "#fafbfd" });
export const memberCell = style({ display: "flex", alignItems: "center", gap: 9 });
export const summaryCell = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
export const unread = style({
  display: "block",
  marginTop: 3,
  color: "#245ed6",
  fontSize: 8,
  fontWeight: 900,
});
export const projectList = style({ display: "flex", minWidth: 0, flexWrap: "wrap", gap: 4 });
export const hoursCell = style({ color: "#20334f", fontWeight: 900 });
export const submitted = style({
  display: "inline-flex",
  borderRadius: 999,
  color: "#087249",
  background: "#e7f7f0",
  padding: "4px 7px",
  fontSize: 9,
  fontWeight: 900,
});
export const draft = style({
  display: "inline-flex",
  borderRadius: 999,
  color: "#795a16",
  background: "#fff5d8",
  padding: "4px 7px",
  fontSize: 9,
  fontWeight: 900,
});
export const notSubmitted = style({
  display: "inline-flex",
  borderRadius: 999,
  color: "#6c798c",
  background: "#edf1f6",
  padding: "4px 7px",
  fontSize: 9,
  fontWeight: 900,
});
export const blocker = style({ color: "#bd5f19", fontWeight: 900 });
export const none = style({ color: "#8a96a8" });
export const openButton = style({
  display: "grid",
  width: 28,
  height: 28,
  placeItems: "center",
  border: "1px solid #d4deeb",
  borderRadius: 5,
  color: "#245ed6",
  background: "#fff",
  cursor: "pointer",
  selectors: { "&:hover": { borderColor: "#9cb7ef", background: "#f1f6ff" } },
});
export const rowActions = style({ display: "flex", alignItems: "center", gap: 4 });
export const commentRow = style({ background: "#f5f8fd" });
export const quickComment = style({
  display: "grid",
  gridTemplateColumns: "180px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
  padding: "4px 2px",
});

globalStyle(`${toolbar} > div`, { display: "grid", gap: 3 });
globalStyle(`${toolbar} > ${toolbarActions}`, { display: "flex" });
globalStyle(`${toolbar} > div > strong`, { color: "#263750", fontSize: 14 });
globalStyle(`${toolbar} > div > span`, { color: "#7b899c", fontSize: 10, fontWeight: 700 });
globalStyle(`${datePicker} select`, {
  height: 34,
  minWidth: 170,
  border: "1px solid #cdd8e6",
  borderRadius: 6,
  color: "#33435b",
  background: "#fff",
  padding: "0 9px",
  fontSize: 10,
  fontWeight: 800,
});
globalStyle(`${dateNavigation} > button`, {
  display: "grid",
  height: "100%",
  minWidth: 30,
  placeItems: "center",
  border: 0,
  borderRight: "1px solid #dde5ef",
  color: "#53657e",
  background: "transparent",
  padding: "0 8px",
  fontSize: 9,
  fontWeight: 800,
  cursor: "pointer",
});
globalStyle(`${dateNavigation} > button:last-child`, { borderRight: 0 });
globalStyle(`${dateNavigation} svg`, { width: 13, height: 13 });
globalStyle(`${remindButton} svg`, { width: 14, height: 14 });
globalStyle(`${summaryCard} > span`, {
  display: "grid",
  width: 34,
  height: 34,
  placeItems: "center",
  borderRadius: 6,
  color: "#3768ca",
  background: "#edf4ff",
});
globalStyle(`${summaryCard} svg`, { width: 18, height: 18 });
globalStyle(`${summaryCard} > div`, { display: "grid", gap: 2 });
globalStyle(`${summaryCard} small`, { color: "#738198", fontSize: 9, fontWeight: 800 });
globalStyle(`${summaryCard} strong`, { color: "#1f304a", fontSize: 20, letterSpacing: 0 });
globalStyle(`${table} th`, {
  height: 36,
  borderBottom: "1px solid #dce4ef",
  color: "#66758b",
  background: "#f7f9fc",
  padding: "0 10px",
  fontSize: 9,
  fontWeight: 900,
  textAlign: "left",
});
globalStyle(`${table} td`, { height: 58, borderBottom: "1px solid #e5eaf1", padding: "8px 10px" });
globalStyle(`${table} tbody tr:last-child td`, { borderBottom: 0 });
globalStyle(`${table} tbody tr:hover`, { background: "#f8faff" });
globalStyle(`${table} th:nth-child(1)`, { width: 150 });
globalStyle(`${table} th:nth-child(2)`, { width: 78 });
globalStyle(`${table} th:nth-child(4)`, { width: 190 });
globalStyle(`${table} th:nth-child(5)`, { width: 60 });
globalStyle(`${table} th:nth-child(6)`, { width: 80 });
globalStyle(`${table} th:nth-child(7)`, { width: 72 });
globalStyle(`${memberCell} > span`, {
  display: "grid",
  width: 28,
  height: 28,
  flex: "0 0 auto",
  placeItems: "center",
  borderRadius: 6,
  color: "#2055c4",
  background: "#eaf1ff",
  fontSize: 9,
  fontWeight: 900,
});
globalStyle(`${memberCell} > div`, { display: "grid", gap: 2, minWidth: 0 });
globalStyle(`${memberCell} strong`, {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
globalStyle(`${memberCell} small`, { color: "#8490a2", fontSize: 8 });
globalStyle(`${projectList} > span`, {
  maxWidth: "100%",
  overflow: "hidden",
  borderRadius: 4,
  color: "#425675",
  background: "#edf2f8",
  padding: "3px 5px",
  fontSize: 8,
  fontWeight: 800,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
globalStyle(`${openButton} svg`, { width: 14, height: 14 });
globalStyle(`${quickComment} > div`, { display: "grid", gap: 2 });
globalStyle(`${quickComment} > div > strong`, { color: "#2d405e", fontSize: 10 });
globalStyle(`${quickComment} > div > span`, { color: "#7d899b", fontSize: 8 });
globalStyle(`${quickComment} textarea`, {
  minHeight: 58,
  resize: "vertical",
  border: "1px solid #cdd8e7",
  borderRadius: 6,
  padding: "8px 9px",
  color: "#2f405a",
  fontFamily: "inherit",
  fontSize: 10,
  lineHeight: 1.5,
});
globalStyle(`${quickComment} > button`, {
  height: 32,
  border: 0,
  borderRadius: 6,
  color: "#fff",
  background: "#2864ea",
  padding: "0 11px",
  fontSize: 9,
  fontWeight: 900,
  cursor: "pointer",
});
globalStyle(`${quickComment} > button:disabled`, { cursor: "default", opacity: 0.45 });
