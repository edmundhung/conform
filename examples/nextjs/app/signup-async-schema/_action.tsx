'use server';

import { redirect } from 'next/navigation';
import { parseSubmission, report } from '@conform-to/react/future';
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
			error: {
				issues: result.error.issues,
			},
		});
	}

	// Simulate server processing
	if (result.data.password !== 'secret') {
		return report(submission, {
			error: {
				formErrors: ['Signup Failed. The password must be "secret"'],
			},
		});
	}

	redirect(`/?value=${JSON.stringify(result.data)}`);
}
