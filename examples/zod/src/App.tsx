import { useFieldset, useForm } from '@conform-to/react';
import { resolve } from '@conform-to/zod';
import { z } from 'zod';

const schema = resolve(
	z
		.object({
			email: z
				.string({ required_error: 'Email is required' })
				.email('Please enter a valid email'),
			password: z
				.string({ required_error: 'Password is required' })
				.min(10, 'The password should be at least 10 characters long'),
			'confirm-password': z.string({
				required_error: 'Confirm Password is required',
			}),
		})
		.refine((value) => value.password === value['confirm-password'], {
			message: 'The password does not match',
			path: ['confirm-password'],
		}),
);

export default function SignupForm() {
	const formProps = useForm({
		validate: schema.validate,
		onSubmit: async (event) => {
			event.preventDefault();

			const formData = new FormData(event.currentTarget);
			const submission = schema.parse(formData);

			console.log(submission);
		},
	});
	const {
		email,
		password,
		'confirm-password': confirmPassword,
	} = useFieldset<z.infer<typeof schema.source>>(formProps.ref);

	return (
		<form {...formProps}>
			<label>
				<div>Email</div>
				<input type="email" name="email" />
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
