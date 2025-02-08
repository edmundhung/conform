'use server';

import { parseSubmission, report } from 'conform-react';
import { resolveZodResult } from 'conform-zod';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { updateTodos } from '@/app/todos/_store';
import { todosSchema } from './_schema';

export async function createTodos(_: unknown, formData: FormData) {
	const submission = parseSubmission(formData);
	const result = todosSchema.safeParse(submission.value);

	if (!result.success) {
		return report(submission, {
			error: resolveZodResult(result),
		});
	}

	await updateTodos(result.data);
	await revalidatePath('/todos');

	return report<z.input<typeof todosSchema>>(submission, {
		reset: true,
	});
}
