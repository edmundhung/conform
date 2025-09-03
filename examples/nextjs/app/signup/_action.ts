'use server';

import { parseSubmission, report } from '@conform-to/react/future';
import { formatResult } from '@conform-to/zod/v3/future';
import { redirect } from 'next/navigation';
import { signupSchema } from './_schema';

export async function signup(_: unknown, formData: FormData) {
	const submission = parseSubmission(formData);
	const result = signupSchema.safeParse(submission.payload);

	if (!result.success) {
		return report(submission, {
			error: formatResult(result),
		});
	}

	// Simulate server processing
	if (result.data.password !== 'secret') {
		return report(submission, {
			error: {
				formErrors: ['Signup Failed. The password must be secret"'],
			},
		});
	}

	redirect(`/?value=${JSON.stringify(result.data)}`);
}
