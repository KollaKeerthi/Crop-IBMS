import { z } from "zod";
import { SubBlockSchema } from "@/features/sub-blocks/schema";

export { SubBlockSchema };

const GeoJsonSchema = z.any(); // GeoJSON Polygon / geometry

const GeneratedBlockInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  rows: z.number().int().positive().optional(),
  rowLengthM: z.number().positive().optional(),
  rowWidthM: z.number().positive().optional(),
  rowSpaceM: z.number().positive().optional(),
  crops: z.string().trim().max(1000).optional(),
});

// ── Field ────────────────────────────────────────────────────────────────────

export const CreateFieldInputSchema = z.object({
  farmId: z.string().uuid({ message: "farmId must be a valid UUID" }),
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be 200 characters or fewer" }),
  areaSqm: z.number().positive().optional(),
  notes: z.string().trim().max(2000).optional(),
  boundary: GeoJsonSchema.optional(),
  boundaryPolygon: GeoJsonSchema.optional(),
  boundary_polygon: GeoJsonSchema.optional(),
  blocks: z.array(GeneratedBlockInputSchema).optional(),
});

export const UpdateFieldInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  areaSqm: z.number().positive().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  boundary: GeoJsonSchema.optional().nullable(),
  boundaryPolygon: GeoJsonSchema.optional().nullable(),
  boundary_polygon: GeoJsonSchema.optional().nullable(),
});

export const FieldSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  areaSqm: z.number().nullable(),
  noOfBlocks: z.number(),
  notes: z.string().nullable(),
  boundary: GeoJsonSchema.nullable(),
  boundaryPolygon: GeoJsonSchema.nullable(),
  boundary_polygon: GeoJsonSchema.nullable().optional(),
  createdAt: z.string(),
});

export const FieldsResponseSchema = z.array(FieldSchema);

export type CreateFieldInput = z.infer<typeof CreateFieldInputSchema>;
export type UpdateFieldInput = z.infer<typeof UpdateFieldInputSchema>;
export type Field = z.infer<typeof FieldSchema>;

// ── Greenhouse ───────────────────────────────────────────────────────────────

export const CreateGreenhouseInputSchema = z.object({
  farmId: z.string().uuid({ message: "farmId must be a valid UUID" }),
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be 200 characters or fewer" }),
  areaSqm: z.number().positive().optional(),
  notes: z.string().trim().max(2000).optional(),
  boundary: GeoJsonSchema.optional(),
  boundaryPolygon: GeoJsonSchema.optional(),
  boundary_polygon: GeoJsonSchema.optional(),
  blocks: z.array(GeneratedBlockInputSchema).optional(),
});

export const UpdateGreenhouseInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  areaSqm: z.number().positive().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  boundary: GeoJsonSchema.optional().nullable(),
  boundaryPolygon: GeoJsonSchema.optional().nullable(),
  boundary_polygon: GeoJsonSchema.optional().nullable(),
});

export const GreenhouseSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  areaSqm: z.number().nullable(),
  notes: z.string().nullable(),
  boundary: GeoJsonSchema.nullable(),
  boundaryPolygon: GeoJsonSchema.nullable(),
  boundary_polygon: GeoJsonSchema.nullable().optional(),
  createdAt: z.string(),
});

export const GreenhousesResponseSchema = z.array(GreenhouseSchema);

export type CreateGreenhouseInput = z.infer<typeof CreateGreenhouseInputSchema>;
export type UpdateGreenhouseInput = z.infer<typeof UpdateGreenhouseInputSchema>;
export type Greenhouse = z.infer<typeof GreenhouseSchema>;

// ── Block ────────────────────────────────────────────────────────────────────

export const BlockParentTypeSchema = z.enum(["field", "greenhouse"]);

export const CreateBlockInputSchema = z.object({
  farmId: z.string().uuid({ message: "farmId must be a valid UUID" }),
  parentType: BlockParentTypeSchema,
  parentId: z.string().uuid({ message: "parentId must be a valid UUID" }),
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be 200 characters or fewer" }),
  areaSqm: z.number().positive().optional(),
  notes: z.string().trim().max(2000).optional(),
  boundary: GeoJsonSchema.optional(),
  boundaryPolygon: GeoJsonSchema.optional(),
  boundary_polygon: GeoJsonSchema.optional(),
});

export const UpdateBlockInputSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  areaSqm: z.number().positive().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  boundary: GeoJsonSchema.optional().nullable(),
  boundaryPolygon: GeoJsonSchema.optional().nullable(),
  boundary_polygon: GeoJsonSchema.optional().nullable(),
});

export const BlockSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  parentType: BlockParentTypeSchema,
  parentId: z.string().uuid(),
  name: z.string(),
  areaSqm: z.number().nullable(),
  notes: z.string().nullable(),
  boundary: GeoJsonSchema.nullable(),
  boundaryPolygon: GeoJsonSchema.nullable(),
  boundary_polygon: GeoJsonSchema.nullable().optional(),
  createdAt: z.string(),
  subBlocks: z.array(SubBlockSchema).optional(),
});

export const BlocksResponseSchema = z.array(BlockSchema);

export type CreateBlockInput = z.infer<typeof CreateBlockInputSchema>;
export type UpdateBlockInput = z.infer<typeof UpdateBlockInputSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type BlockParentType = z.infer<typeof BlockParentTypeSchema>;

// ── Hierarchy ────────────────────────────────────────────────────────────────

export const FieldWithBlocksSchema = FieldSchema.extend({
  blocks: z.array(BlockSchema),
});

export const GreenhouseWithBlocksSchema = GreenhouseSchema.extend({
  blocks: z.array(BlockSchema),
});

export const LocationHierarchySchema = z.object({
  fields: z.array(FieldWithBlocksSchema),
  greenhouses: z.array(GreenhouseWithBlocksSchema),
});

export type FieldWithBlocks = z.infer<typeof FieldWithBlocksSchema>;
export type GreenhouseWithBlocks = z.infer<typeof GreenhouseWithBlocksSchema>;
export type LocationHierarchy = z.infer<typeof LocationHierarchySchema>;
