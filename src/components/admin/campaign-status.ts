import type { Doc } from "@convex/_generated/dataModel";

export const STATUS_TONE = { draft: "gray", scheduled: "blue", sending: "amber", sent: "green", failed: "red" } as const;
export const STATUS_LABEL: Record<Doc<"campaigns">["status"], string> = {
  draft: "Ciornă",
  scheduled: "Programată",
  sending: "Se trimite",
  sent: "Trimisă",
  failed: "Eșuată",
};
