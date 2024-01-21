import type { Intent } from '@conform-to/react';
import { conformZodMessage } from '@conform-to/zod';
import { z } from 'zod';

export const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean().optional(),
});

export const todosSchema = z.object({
	title: z.string(),
	tasks: z.array(taskSchema).nonempty(),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
	remember: z.boolean().optional(),
});

export function createSignupSchema(
	intent: Intent | null,
	options?: {
		// isUsernameUnique is only defined on the server
		isUsernameUnique: (username: string) => Promise<boolean>;
	},
) {
	return z
		.object({
			username: z
				.string({ required_error: 'Username is required' })
				.regex(
					/^[a-zA-Z0-9]+$/,
					'Invalid username: only letters or numbers are allowed',
				)
				// Pipe the schema so it runs only if the username is valid
				.pipe(
					z.string().superRefine((username, ctx) => {
						const isValidatingUsername =
							intent === null ||
							(intent.type === 'validate' &&
								intent.payload.name === 'username');

						if (!isValidatingUsername) {
							ctx.addIssue({
								code: 'custom',
								message: conformZodMessage.VALIDATION_SKIPPED,
							});
							return;
						}

						if (typeof options?.isUsernameUnique !== 'function') {
							ctx.addIssue({
								code: 'custom',
								message: conformZodMessage.VALIDATION_UNDEFINED,
								fatal: true,
							});
							return;
						}

						return options.isUsernameUnique(username).then((isUnique) => {
							if (!isUnique) {
								ctx.addIssue({
									code: 'custom',
									message: 'Username is already used',
								});
							}
						});
					}),
				),
		})
		.and(
			z
				.object({
					password: z.string({ required_error: 'Password is required' }),
					confirmPassword: z.string({
						required_error: 'Confirm password is required',
					}),
				})
				.refine((data) => data.password === data.confirmPassword, {
					message: 'Password does not match',
					path: ['confirmPassword'],
				}),
		);
}
