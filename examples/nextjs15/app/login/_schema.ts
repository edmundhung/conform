import { coerceZodFormData } from 'conform-zod';
import { z } from 'zod';

export const loginSchema = coerceZodFormData(
	z.object({
		email: z.string().email(),
		password: z.string(),
		remember: z.boolean().optional(),
	}),
);
