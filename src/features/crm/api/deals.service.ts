import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type { Deal, CreateDealDTO, UpdateDealDTO } from "../types/deals.types";

const base = createCrmCollectionService<Deal, CreateDealDTO, UpdateDealDTO>(
  CRM_COLLECTIONS.deals,
  "DealsService",
  {
    currency: "USD",
    stage: "lead",
    probability: 1,
    amount: 0,
    ownerId: null,
    assignedTo: null,
    tags: [],
  }
);

export const DealsService = {
  getDeals: base.getAll,
  getDealById: base.getById,
  createDeal: base.create,
  updateDeal: base.update,
  deleteDeal: base.delete,
};
