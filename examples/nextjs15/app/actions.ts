'use server';

import { redirect } from 'next/navigation';
import { parseSubmission, report } from 'conform-react';
import { resolveZodResult } from 'conform-zod';
import { todosSchema, loginSchema, createSignupSchema } from '@/app/schema';
import { z } from 'zod';

export async function login(_: unknown, formData: FormData) {
	const submission = parseSubmission(formData);
	const result = loginSchema.safeParse(submission.value);

	if (!result.success) {
		return report(submission, resolveZodResult(result));
	}

	redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export async function createTodos(_: unknown, formData: FormData) {
	const submission = parseSubmission(formData);
	const result = todosSchema.safeParse(submission.value);

	if (!result.success) {
		return report(submission, resolveZodResult(result));
	}

	redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export async function signup(_: unknown, formData: FormData) {
	const schema = createSignupSchema({
		isUsernameUnique(username) {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(username === 'example' && Math.random() < 0.2);
				}, Math.random() * 500);
			});
		},
	});
	const submission = parseSubmission(formData);
	const result = await schema.safeParseAsync(submission.value);

	if (!result.success) {
		return report(submission, resolveZodResult(result));
	}

	return report<typeof submission, z.input<typeof schema>>(submission, {
		reset: true,
	});
	// redirect(`/?value=${JSON.stringify(submission.value)}`);
}
