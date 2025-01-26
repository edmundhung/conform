'use server';

import { redirect } from 'next/navigation';
import { parseSubmission, report } from 'conform-react';
import { resolveZodResult } from 'conform-zod';
import { todosSchema, loginSchema, createSignupSchema } from '@/app/schema';
import { z } from 'zod';
import { updateTodos } from './store';
import { revalidatePath } from 'next/cache';

export async function login(_: unknown, formData: FormData) {
	const submission = parseSubmission(formData);
	const result = loginSchema.safeParse(submission.value);

	if (!result.success) {
		return report(submission, resolveZodResult(result));
	}

	redirect(`/?value=${JSON.stringify(result.data)}`);
}

export async function createTodos(_: unknown, formData: FormData) {
	const submission = parseSubmission(formData);
	const result = todosSchema.safeParse(submission.value);

	if (!result.success) {
		return report(submission, resolveZodResult(result));
	}

	await updateTodos(result.data);
	await revalidatePath('/todos');

	return report<typeof submission, z.input<typeof todosSchema>>(submission, {
		reset: true,
	});
}

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
		return report(submission, resolveZodResult(result));
	}

	if (Math.random() < 0.7) {
		return report<typeof submission, z.input<typeof schema>>(submission, {
			error: {
				formError: ['Server error: Please try again later'],
			},
		});
	}

	redirect(`/?value=${JSON.stringify(result.data)}`);
}
