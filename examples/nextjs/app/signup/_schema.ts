import { memoize, coerceZodFormData } from 'conform-zod';
import { z } from 'zod';

export function createSignupSchema(checks: {
	isUsernameUnique: (username: string) => Promise<boolean>;
}) {
	const isUsernameUnique = memoize(checks.isUsernameUnique);

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
						message: 'Username is already used. How about "example"?',
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
