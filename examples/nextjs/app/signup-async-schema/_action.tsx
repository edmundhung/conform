'use server';

import { redirect } from 'next/navigation';
import { parseSubmission, report } from '@conform-to/react/future';
import { formatResult } from '@conform-to/zod/v3/future';
import { createSignupSchema } from '../signup/_schema';

export async function signupAsyncSchema(
	prevState: unknown,
	formData: FormData,
) {
	const schema = createSignupSchema({
		async isUsernameUnique(username) {
			await new Promise((resolve) => {
				setTimeout(resolve, Math.random() * 500);
			});
			return username === 'example';
		},
	});

	const submission = parseSubmission(formData);
	const result = await schema.safeParseAsync(submission.payload);

	if (!result.success) {
		return report(submission, {
			error: formatResult(result),
		});
	}

	// Simulate server processing
	if (Math.random() < 0.7) {
		return report(submission, {
			error: {
				formErrors: ['Server error: Please try again later'],
			},
		});
	}

	redirect(`/?value=${JSON.stringify(result.data)}`);
}
