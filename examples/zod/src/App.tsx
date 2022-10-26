import { useFieldset, useForm } from '@conform-to/react';
import { formatError } from '@conform-to/zod';
import { z } from 'zod';

const schema = z
	.object({
		email: z
			.string()
			.min(1, 'Email is required')
			.email('Please enter a valid email'),
		password: z
			.string()
			.min(1, 'Password is required')
			.min(10, 'The password should be at least 10 characters long'),
		'confirm-password': z.string().min(1, 'Confirm Password is required'),
	})
	.refine((value) => value.password === value['confirm-password'], {
		message: 'The password does not match',
		path: ['confirm-password'],
	});

export default function SignupForm() {
	const form = useForm<z.infer<typeof schema>>({
		onValidate({ submission }) {
			// Only sync validation is allowed on the client side
			const result = schema.safeParse(submission.value);

			if (result.success) {
				return [];
			}

			/**
			 * The `formatError` helper simply resolves the ZodError to
			 * a set of key/value pairs which refers to the name and
			 * error of each field.
			 */
			return formatError(result.error);
		},
		onSubmit(event, { submission }) {
			event.preventDefault();

			console.log(submission);
		},
	});
	const {
		email,
		password,
		'confirm-password': confirmPassword,
	} = useFieldset(form.ref, form.config);

	return (
		<form {...form.props}>
			<label>
				<div>Email</div>
				<input type="email" name="email" autoComplete="off" />
				<div>{email.error}</div>
			</label>
			<label>
				<div>Password</div>
				<input type="password" name="password" />
				<div>{password.error}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input type="password" name="confirm-password" />
				<div>{confirmPassword.error}</div>
			</label>
			<div>
				<button type="submit">Login</button>
			</div>
		</form>
	);
}
