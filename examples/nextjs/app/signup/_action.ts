import { parseSubmission, report } from 'conform-react';
import { resolveZodResult } from 'conform-zod';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSignupSchema } from './_schema';

export async function signup(_: unknown, formData: FormData) {
	const schema = createSignupSchema({
		isUsernameUnique(username) {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(username === 'example');
				}, Math.random() * 500);
			});
		},
	});
	const submission = parseSubmission(formData);
	const result = await schema.safeParseAsync(submission.value);

	if (!result.success) {
		return report(submission, {
			error: resolveZodResult(result),
		});
	}

	if (Math.random() < 0.7) {
		return report<z.infer<typeof schema>>(submission, {
			error: {
				formErrors: ['Server error: Please try again later'],
			},
		});
	}

	redirect(`/?value=${JSON.stringify(result.data)}`);
}
