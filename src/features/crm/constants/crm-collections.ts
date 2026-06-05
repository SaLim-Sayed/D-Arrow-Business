/** Firestore subcollection names under companies/{companyId}/ */
export const CRM_COLLECTIONS = {
  leads: "leads",
  contacts: "contacts",
  deals: "deals",
  crmTasks: "crm_tasks",
  activities: "activities",
  notes: "notes",
  attachments: "crm_attachments",
  notifications: "crm_notifications",
} as const;

export type CrmCollectionName = (typeof CRM_COLLECTIONS)[keyof typeof CRM_COLLECTIONS];
