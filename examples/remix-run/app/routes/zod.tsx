import { conform, parse, useForm } from '@conform-to/react';
import { formatError } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

const schema = z
	.object({
		email: z.string().min(1, 'Email is required').email('Email is invalid'),
		password: z.string().min(1, 'Password is required'),
		confirmPassword: z.string().min(1, 'Confirm Password is required'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Password does not match',
		path: ['confirmPassword'],
	});

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse<z.infer<typeof schema>>(formData);

	try {
		switch (submission.type) {
			case 'validate':
			case 'submit': {
				schema.parse(submission.value);

				if (submission.type === 'submit') {
					throw new Error('Not implemented');
				}

				break;
			}
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

export default function Signup() {
	const state = useActionData<typeof action>();
	const [form, { email, password, confirmPassword }] = useForm<
		z.infer<typeof schema>
	>({
		mode: 'server-validation',
		initialReport: 'onBlur',
		state,
	});

	return (
		<Form method="post" {...form.props}>
			<fieldset>
				<legend>{form.error}</legend>
				<label>
					<div>Email</div>
					<input
						className={email.error ? 'error' : ''}
						{...conform.input(email.config)}
					/>
					<div>{email.error}</div>
				</label>
				<label>
					<div>Password</div>
					<input
						className={password.error ? 'error' : ''}
						{...conform.input(password.config, { type: 'password' })}
					/>
					<div>{password.error}</div>
				</label>
				<label>
					<div>Confirm Password</div>
					<input
						className={confirmPassword.error ? 'error' : ''}
						{...conform.input(confirmPassword.config, { type: 'password' })}
					/>
					<div>{confirmPassword.error}</div>
				</label>
			</fieldset>
			<button type="submit">Signup</button>
		</Form>
	);
}
