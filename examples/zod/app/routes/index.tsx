import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
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
		confirmPassword: z.string().min(1, 'Confirm Password is required'),
	})
	.refine((value) => value.password === value.confirmPassword, {
		message: 'Password does not match',
		path: ['confirmPassword'],
	});

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	if (!submission.value || submission.intent !== 'submit') {
		return json({
			...submission,
			payload: {
				email: submission.payload.email,
			},
		});
	}

	throw new Error('Not implemented');
}

export default function SignupForm() {
	const state = useActionData<typeof action>();
	const [form, { email, password, confirmPassword }] = useForm<
		z.input<typeof schema>
	>({
		state,
		initialReport: 'onBlur',
		onValidate({ formData }) {
			return parse(formData, { schema });
		},
	});

	return (
		<Form method="post" {...form.props}>
			<label>
				<div>Email</div>
				<input
					className={email.error ? 'error' : ''}
					{...conform.input(email.config)}
				/>
				<div>{email.error}</div>
			</label>
			<div>
				<label>Password</label>
				<input
					className={password.error ? 'error' : ''}
					{...conform.input(password.config, { type: 'password' })}
				/>
				<div>{password.error}</div>
			</div>
			<div>
				<label>Confirm Password</label>
				<input
					className={confirmPassword.error ? 'error' : ''}
					{...conform.input(confirmPassword.config, { type: 'password' })}
				/>
				<div>{confirmPassword.error}</div>
			</div>
			<button>Login</button>
		</Form>
	);
}
