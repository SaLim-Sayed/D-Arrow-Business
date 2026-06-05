import type { Lead, UpdateLeadDTO } from "../types/leads.types";
import type { CreateActivityDTO } from "../types/activities.types";
import { normalizeLeadStatus } from "../constants/lead-workflow";

const TRACKED_FIELDS: (keyof UpdateLeadDTO)[] = [
  "name",
  "company",
  "email",
  "phone",
  "status",
  "source",
  "priority",
  "assignedTo",
  "notes",
];

export function buildLeadUpdateActivity(
  before: Lead,
  patch: UpdateLeadDTO,
  userId: string
): CreateActivityDTO | null {
  const lines: string[] = [];

  for (const key of TRACKED_FIELDS) {
    if (patch[key] === undefined) continue;
    const prev = before[key as keyof Lead];
    const next = patch[key];
    if (JSON.stringify(prev) === JSON.stringify(next)) continue;

    if (key === "status") {
      lines.push(
        `Status: ${normalizeLeadStatus(String(prev))} → ${normalizeLeadStatus(String(next))}`
      );
    } else {
      lines.push(`${key}: ${prev ?? "—"} → ${next ?? "—"}`);
    }
  }

  if (!lines.length) return null;

  return {
    type: "note",
    subject: "Lead updated",
    description: lines.join("\n"),
    entityType: "lead",
    entityId: before.id,
    occurredAt: new Date().toISOString(),
    userId,
  };
}

export function buildLeadCreatedActivity(leadId: string, leadName: string, userId: string): CreateActivityDTO {
  return {
    type: "note",
    subject: "Lead created",
    description: `Lead "${leadName}" was created.`,
    entityType: "lead",
    entityId: leadId,
    occurredAt: new Date().toISOString(),
    userId,
  };
}
