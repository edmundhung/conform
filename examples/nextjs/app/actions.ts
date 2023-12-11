'use server';

import { redirect } from 'next/navigation';
import { parseWithZod } from '@conform-to/zod';
import { todosSchema, loginSchema, createSignupSchema } from '@/app/schema';

export async function login(prevState: unknown, formData: FormData) {
	const submission = parseWithZod(formData, {
		schema: loginSchema,
	});

	if (!submission.value) {
		return submission.reject();
	}

	redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export async function createTodos(prevState: unknown, formData: FormData) {
	const submission = parseWithZod(formData, {
		schema: todosSchema,
	});

	if (!submission.value) {
		return submission.reject();
	}

	redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export async function signup(prevState: unknown, formData: FormData) {
	const submission = await parseWithZod(formData, {
		schema: (intent) =>
			// create the zod schema with the intent and constraint
			createSignupSchema(intent, {
				isUsernameUnique(username) {
					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(username !== 'admin');
						}, Math.random() * 300);
					});
				},
			}),
		async: true,
	});

	if (!submission.value) {
		return submission.reject();
	}

	redirect(`/?value=${JSON.stringify(submission.value)}`);
}
