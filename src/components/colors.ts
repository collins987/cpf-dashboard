export const SUBSIDIARY_COLORS = {
  rukisha: { hex: "#1F5FA8", rgba: "rgba(31,95,168,0.10)" },
  cpffs: { hex: "#2E8B57", rgba: "rgba(46,139,87,0.10)" },
  cpfca: { hex: "#C1440E", rgba: "rgba(193,68,14,0.10)" },
} as const;

export type SubsidiaryColorKey = keyof typeof SUBSIDIARY_COLORS;
