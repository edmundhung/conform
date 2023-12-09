'use server';

import { redirect } from 'next/navigation';
import { parse } from '@conform-to/zod';
import { todosSchema, loginSchema, createSignupSchema } from '@/app/schema';

export async function login(prevState: unknown, formData: FormData) {
	const submission = parse(formData, {
		schema: loginSchema,
	});

	if (!submission.value) {
		return submission.reject();
	}

	redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export async function createTodos(prevState: unknown, formData: FormData) {
	const submission = parse(formData, {
		schema: todosSchema,
	});

	if (!submission.value) {
		return submission.reject();
	}

	redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export async function signup(prevState: unknown, formData: FormData) {
	const submission = await parse(formData, {
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
