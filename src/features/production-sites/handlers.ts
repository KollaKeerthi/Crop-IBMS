import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { listProductionSites, getProductionSiteById } from "./queries";
import { insertProductionSite, updateProductionSite, deleteProductionSite } from "./mutations";
import type {
  CreateProductionSiteInput,
  UpdateProductionSiteInput,
  ProductionSite,
} from "./schema";

export async function listProductionSitesHandler(ctx: ApiContext): Promise<ProductionSite[]> {
  return listProductionSites();
}

export async function getProductionSiteHandler(
  ctx: ApiContext,
  siteId: string
): Promise<ProductionSite> {
  const site = await getProductionSiteById(siteId);
  if (!site) throw new ApiError(404, "not_found", "Production site not found.");
  return site;
}

export async function createProductionSiteHandler(
  ctx: ApiContext,
  input: CreateProductionSiteInput
): Promise<ProductionSite> {
  const site = await insertProductionSite(input);
  if (!site) throw new ApiError(500, "internal_error", "Could not create production site.");

  log.info({ userId: ctx.userId, siteId: site.id }, "production_sites.created");
  await logAudit({
    userId: ctx.userId,
    action: "production_site.created",
    resource: site.id,
    metadata: { code: input.code },
  });

  return site;
}

export async function updateProductionSiteHandler(
  ctx: ApiContext,
  siteId: string,
  input: UpdateProductionSiteInput
): Promise<ProductionSite> {
  const existing = await getProductionSiteById(siteId);
  if (!existing) throw new ApiError(404, "not_found", "Production site not found.");

  const updated = await updateProductionSite(siteId, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update production site.");

  log.info({ userId: ctx.userId, siteId }, "production_sites.updated");
  await logAudit({ userId: ctx.userId, action: "production_site.updated", resource: siteId });

  return updated;
}

export async function deleteProductionSiteHandler(ctx: ApiContext, siteId: string): Promise<void> {
  const existing = await getProductionSiteById(siteId);
  if (!existing) throw new ApiError(404, "not_found", "Production site not found.");

  await deleteProductionSite(siteId);

  log.info({ userId: ctx.userId, siteId }, "production_sites.deleted");
  await logAudit({ userId: ctx.userId, action: "production_site.deleted", resource: siteId });
}
