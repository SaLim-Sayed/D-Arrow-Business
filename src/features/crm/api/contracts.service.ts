import { createCrmCollectionService } from "./crm-base.service";
import { CRM_COLLECTIONS } from "../constants/crm-collections";
import type {
  SavedContract,
  CreateContractDTO,
  UpdateContractDTO,
} from "../types/contract.types";

const base = createCrmCollectionService<
  SavedContract,
  CreateContractDTO,
  UpdateContractDTO
>(CRM_COLLECTIONS.contracts, "ContractsService", {
  status: "draft",
  approvalStatus: "pending",
});

export const ContractsService = {
  getAll: base.getAll,
  getById: base.getById,
  create: base.create,
  update: base.update,
  delete: base.delete,
};
