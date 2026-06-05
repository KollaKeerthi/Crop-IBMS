import type { ApiContext } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { log } from "@/lib/log";
import { logAudit } from "@/lib/audit";
import { findUserThing, listUserThings } from "./queries";
import { insertThing, updateThing, deleteThing } from "./mutations";
import type { CreateThingInput, UpdateThingInput, Thing } from "./schema";

export async function listThings(ctx: ApiContext): Promise<Thing[]> {
  return listUserThings(ctx.userId);
}

export async function getThing(ctx: ApiContext, id: string): Promise<Thing> {
  const thing = await findUserThing(ctx.userId, id);
  if (!thing) throw new ApiError(404, "not_found", "Thing not found.");
  return thing;
}

export async function createThing(ctx: ApiContext, input: CreateThingInput): Promise<Thing> {
  const thing = await insertThing(ctx.userId, input);
  if (!thing) throw new ApiError(500, "internal_error", "Could not create thing.");

  log.info({ userId: ctx.userId, thingId: thing.id }, "things.created");
  await logAudit({
    userId: ctx.userId,
    action: "thing.created",
    resource: thing.id,
    metadata: { name: input.name },
  });

  return thing;
}

export async function patchThing(
  ctx: ApiContext,
  id: string,
  input: UpdateThingInput
): Promise<Thing> {
  const existing = await findUserThing(ctx.userId, id);
  if (!existing) throw new ApiError(404, "not_found", "Thing not found.");

  const updated = await updateThing(ctx.userId, id, input);
  if (!updated) throw new ApiError(500, "internal_error", "Could not update thing.");

  log.info({ userId: ctx.userId, thingId: id }, "things.updated");
  return updated;
}

export async function removeThing(ctx: ApiContext, id: string): Promise<void> {
  const existing = await findUserThing(ctx.userId, id);
  if (!existing) throw new ApiError(404, "not_found", "Thing not found.");

  await deleteThing(ctx.userId, id);

  log.info({ userId: ctx.userId, thingId: id }, "things.deleted");
  await logAudit({ userId: ctx.userId, action: "thing.deleted", resource: id });
}
