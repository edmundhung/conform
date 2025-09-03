import { coerceFormValue } from '@conform-to/zod/v3/future';
import { z } from 'zod';

export const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean().default(false),
});

export const todosSchema = z.object({
	title: z.string(),
	tasks: z.array(taskSchema).nonempty(),
});

export const schema = coerceFormValue(todosSchema);
