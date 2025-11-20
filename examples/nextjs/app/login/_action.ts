'use server';

import { parseSubmission, report } from '@conform-to/react/future';
import { redirect } from 'next/navigation';
import { validateLogin } from './_validation';

export async function login(_: unknown, formData: FormData) {
	const submission = parseSubmission(formData);
	const error = validateLogin(submission.payload);

	if (error) {
		return report(submission, {
			error,
		});
	}

	redirect(`/?value=${JSON.stringify(submission.payload)}`);
}
