import { BillingService } from "../api/billing.service";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  DEFAULT_PRODUCT_UNITS,
  DEFAULT_TAXES,
} from "../data/product-defaults";

const inflight = new Map<string, Promise<void>>();

/** Seed default categories, units, and tax rates when a company has none yet. */
export async function ensureProductCatalogDefaults(companyId: string) {
  const existing = inflight.get(companyId);
  if (existing) return existing;

  const task = (async () => {
    const [categoriesRes, unitsRes, settingsRes] = await Promise.all([
      BillingService.productCategories.getAll(companyId),
      BillingService.productUnits.getAll(companyId),
      BillingService.settings.get(companyId),
    ]);

    const jobs: Promise<unknown>[] = [];

    if (categoriesRes.data.length === 0) {
      jobs.push(
        ...DEFAULT_PRODUCT_CATEGORIES.map((category) =>
          BillingService.productCategories.create(companyId, { ...category })
        )
      );
    }

    if (unitsRes.data.length === 0) {
      jobs.push(
        ...DEFAULT_PRODUCT_UNITS.map((unit) =>
          BillingService.productUnits.create(companyId, { ...unit })
        )
      );
    }

    if (!settingsRes.data.taxes?.length) {
      jobs.push(
        BillingService.settings.update(companyId, { taxes: DEFAULT_TAXES })
      );
    }

    if (jobs.length > 0) {
      await Promise.all(jobs);
    }
  })();

  inflight.set(companyId, task);
  try {
    await task;
  } finally {
    inflight.delete(companyId);
  }
}
