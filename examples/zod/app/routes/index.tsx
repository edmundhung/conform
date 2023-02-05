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
		'confirm-password': z.string().min(1, 'Confirm Password is required'),
	})
	.refine((value) => value.password === value['confirm-password'], {
		message: 'Password does not match',
		path: ['confirm-password'],
	});

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	if (!submission.data || submission.intent !== 'submit') {
		return json({
			...submission,
			value: {
				email: submission.value.email,
			},
		});
	}

	throw new Error('Not implemented');
}

export default function SignupForm() {
	const state = useActionData<typeof action>();
	const [form, { email, password, 'confirm-password': confirmPassword }] =
		useForm({
			state,
			initialReport: 'onBlur',
			onValidate({ formData }) {
				return parse(formData, { schema });
			},
			onSubmit(event, { submission }) {
				console.log(submission.data);
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
