import { coerceZodFormData } from 'conform-zod';
import { z } from 'zod';

export const taskSchema = coerceZodFormData(
	z.object({
		content: z.string(),
		completed: z.boolean().default(false),
	}),
);

export const todosSchema = coerceZodFormData(
	z.object({
		title: z.string(),
		tasks: z.array(taskSchema).nonempty(),
	}),
);

export const loginSchema = coerceZodFormData(
	z.object({
		email: z.string().email(),
		password: z.string(),
		remember: z.boolean().optional(),
	}),
);
