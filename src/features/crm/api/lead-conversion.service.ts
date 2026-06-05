import { LeadsService } from "./leads.service";
import { ContactsService } from "./contacts.service";
import { ActivitiesService } from "./activities.service";
import { reassignCrmEntities } from "./crm-entity-reassign.service";
import { withLogging } from "@/lib/service-utils";
import type { ApiResponse } from "@/types/api.types";
import type { Contact } from "../types/contacts.types";

const SERVICE_NAME = "LeadConversionService";

function splitLeadName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? name,
    lastName: parts.slice(1).join(" ") || "",
  };
}

export const LeadConversionService = {
  async convertToContact(
    companyId: string,
    leadId: string,
    userId: string
  ): Promise<ApiResponse<{ contact: Contact; leadId: string }>> {
    return withLogging(SERVICE_NAME, "convertToContact", (async () => {
      const leadRes = await LeadsService.getLeadById(companyId, leadId);
      const lead = leadRes.data;

      if (lead.contactId) {
        throw new Error("Lead already converted");
      }

      const { firstName, lastName } = splitLeadName(lead.name);
      const contactRes = await ContactsService.createContact(companyId, {
        firstName,
        lastName,
        email: lead.email,
        phone: lead.phone,
        accountName: lead.company,
        leadId: lead.id,
        assignedTo: lead.assignedTo,
        ownerId: lead.ownerId ?? lead.assignedTo,
        tags: lead.tags ?? [],
      });

      await reassignCrmEntities(companyId, "lead", leadId, "contact", contactRes.data.id);

      await LeadsService.updateLead(companyId, leadId, {
        contactId: contactRes.data.id,
        status: "won",
      });

      const now = new Date().toISOString();
      await ActivitiesService.createActivity(companyId, {
        type: "note",
        subject: "Lead converted to contact",
        description: `Lead "${lead.name}" was converted to contact ${firstName} ${lastName}.`.trim(),
        entityType: "lead",
        entityId: leadId,
        occurredAt: now,
        userId,
      });
      await ActivitiesService.createActivity(companyId, {
        type: "note",
        subject: "Converted from lead",
        description: `Contact created from lead "${lead.name}".`,
        entityType: "contact",
        entityId: contactRes.data.id,
        occurredAt: now,
        userId,
      });

      return {
        data: { contact: contactRes.data, leadId },
        message: "Lead converted successfully",
      };
    })());
  },
};
