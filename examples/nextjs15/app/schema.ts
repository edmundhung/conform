import { coerceZodFormData, memorize } from 'conform-zod';
import { z } from 'zod';

export const taskSchema = coerceZodFormData(
	z.object({
		content: z.string(),
		completed: z.boolean().optional(),
	}),
);

export const todosSchema = coerceZodFormData(
	z.object({
		title: z.string(),
		tasks: z.array(taskSchema).nonempty(),
	}),
);

export const loginSchema = coerceZodFormData(
	z.object({
		email: z.string().email(),
		password: z.string(),
		remember: z.boolean().optional(),
	}),
);

export function createSignupSchema(checks: {
	// isUsernameUnique is only defined on the server
	isUsernameUnique: (username: string) => Promise<boolean>;
}) {
	const isUsernameUnique = memorize(checks.isUsernameUnique);

	return coerceZodFormData(
		z
			.object({
				username: z
					.string({ required_error: 'Username is required' })
					.regex(
						/^[a-zA-Z0-9]+$/,
						'Invalid username: only letters or numbers are allowed',
					)
					.refine((username) => isUsernameUnique(username), {
						message: 'Username is already used',
					}),
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
			),
	);
}
