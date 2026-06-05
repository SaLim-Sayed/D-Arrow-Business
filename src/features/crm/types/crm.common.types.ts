export type CrmEntityType = "lead" | "contact" | "deal" | "crm_task";

export type CrmOwnerId = string | null;

export interface CrmTimestamps {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CrmEntityRef {
  entityType: CrmEntityType;
  entityId: string;
}

export interface CrmBaseFields extends CrmTimestamps {
  id: string;
  ownerId?: CrmOwnerId;
  tags?: string[];
}
