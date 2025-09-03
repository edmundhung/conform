'use server';

import { parseSubmission, report } from '@conform-to/react/future';
import { formatResult } from '@conform-to/zod/v3/future';
import { revalidatePath } from 'next/cache';
import { updateTodos } from '@/app/todos/_store';
import { schema } from './_schema';

export async function createTodos(_: unknown, formData: FormData) {
	const submission = parseSubmission(formData);
	const result = schema.safeParse(submission.payload);

	if (!result.success) {
		return report(submission, {
			error: formatResult(result),
		});
	}

	await updateTodos(result.data);
	await revalidatePath('/todos');

	return report(submission, {
		reset: true,
	});
}
