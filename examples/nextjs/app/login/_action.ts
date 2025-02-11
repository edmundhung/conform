'use server';

import { parseSubmission, report } from 'conform-react';
import { resolveZodResult } from 'conform-zod';
import { redirect } from 'next/navigation';
import { loginSchema } from './_schema';

export async function login(_: unknown, formData: FormData) {
	const submission = parseSubmission(formData);
	const result = loginSchema.safeParse(submission.value);

	if (!result.success) {
		return report(submission, {
			error: resolveZodResult(result),
		});
	}

	redirect(`/?value=${JSON.stringify(result.data)}`);
}
