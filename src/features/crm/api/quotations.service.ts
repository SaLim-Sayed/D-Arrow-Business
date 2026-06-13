import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type {
  SavedQuotation,
  CreateQuotationDTO,
  UpdateQuotationDTO,
} from "../types/quotation.types";

const base = createCrmCollectionService<
  SavedQuotation,
  CreateQuotationDTO,
  UpdateQuotationDTO
>(CRM_COLLECTIONS.quotations, "QuotationsService", {
  status: "draft",
  total: 0,
  currency: "SAR",
});

export const QuotationsService = {
  getAll: base.getAll,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,
};
