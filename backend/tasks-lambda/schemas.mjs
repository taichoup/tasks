import { z } from "zod";

const frequencyUnitSchema = z.enum(["day", "week", "month", "year"]);
const tagSchema = z.enum(["maison", "jardin", "vélos", "voiture"]);

export const newTaskSchema = z.object({
    title: z.string().trim().min(1),
    frequency: z.object({
        unit: frequencyUnitSchema,
        value: z.number().int().min(1),
    }),
    tags: z.array(tagSchema).default([]),
});

export const updateTaskSchema = z.object({
    id: z.string().trim().min(1),
    checked: z.boolean().optional(),
    checkedAt: z.union([z.iso.datetime(), z.literal("")]).optional(),
    lastChecked: z.union([z.iso.datetime(), z.literal("")]).optional(),
});

export const deleteTaskSchema = z.object({
    id: z.string().trim().min(1),
});
