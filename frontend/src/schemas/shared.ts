import { z } from "zod";

export const currencySchema = z.number().nonnegative();
export const requiredTextSchema = z.string().trim().min(2);
