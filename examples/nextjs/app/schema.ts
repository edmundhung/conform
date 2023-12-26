import type { FormControl } from '@conform-to/react';
import { refine } from '@conform-to/zod';
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
	control: FormControl | null,
	constraint: {
		// isUsernameUnique is only defined on the server
		isUsernameUnique?: (username: string) => Promise<boolean>;
	} = {},
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
					z.string().superRefine((username, ctx) =>
						refine(ctx, {
							validate: () => constraint.isUsernameUnique?.(username),
							when:
								!control ||
								(control.type === 'validate' &&
									control.payload.name === 'username'),
							message: 'Username is already used',
						}),
					),
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
