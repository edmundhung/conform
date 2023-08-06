import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

const schema = z
	.object({
		email: z
			.string({ required_error: 'Email is required' })
			.email('Please enter a valid email'),
	})
	.and(
		z
			.object({
				password: z
					.string({ required_error: 'Password is required' })
					.min(10, 'The password should be at least 10 characters long'),
				confirmPassword: z.string({
					required_error: 'Confirm password is required',
				}),
			})
			.refine((data) => data.password === data.confirmPassword, {
				message: 'Password does not match',
				path: ['confirmPassword'],
			}),
	);

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	if (!submission.value || submission.intent !== 'submit') {
		return json(submissi);
	}

	throw new Error('Not implemented');
}

export default function SignupForm() {
	const lastSubmission = useActionData<typeof action>();
	const [form, { email, password, confirmPassword }] = useForm<
		z.input<typeof schema>
	>({
		// To handle server error and enable full progressive enhancement
		lastSubmission,

		// Validation are done on the server if `onValidate` is not specified
		// Uncomment the code below to enable client validation
		// onValidate({ formData }) {
		// 	return parse(formData, { schema });
		// },
	});

	return (
		<Form method="post" {...form.props}>
			<label>
				<div>Email</div>
				<input
					className={email.error ? 'error' : ''}
					{...conform.input(email)}
				/>
				<div>{email.error}</div>
			</label>
			<div>
				<label>Password</label>
				<input
					className={password.error ? 'error' : ''}
					{...conform.input(password, { type: 'password' })}
				/>
				<div>{password.error}</div>
			</div>
			<div>
				<label>Confirm Password</label>
				<input
					className={confirmPassword.error ? 'error' : ''}
					{...conform.input(confirmPassword, { type: 'password' })}
				/>
				<div>{confirmPassword.error}</div>
			</div>
			<button>Login</button>
		</Form>
	);
}
