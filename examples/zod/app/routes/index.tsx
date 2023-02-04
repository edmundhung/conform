import { conform, parse, useForm } from '@conform-to/react';
import { formatError, validate } from '@conform-to/zod';
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
	const submission = parse<z.infer<typeof schema>>(formData);

	try {
		const data = schema.parse(submission.value);

		if (submission.intent === 'submit') {
			console.log(data);
			throw new Error('Not implemented');
		}
	} catch (error) {
		submission.error.push(...formatError(error));
	}

	return json({
		...submission,
		value: {
			email: submission.value.email,
		},
	});
}

export default function SignupForm() {
	const state = useActionData<typeof action>();
	const [form, { email, password, 'confirm-password': confirmPassword }] =
		useForm<z.infer<typeof schema>>({
			state,
			initialReport: 'onBlur',
			onValidate({ formData }) {
				return validate(formData, schema);
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
