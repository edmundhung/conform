import { conform, parse, useFieldset, useForm } from '@conform-to/react';
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

async function signup(data: unknown) {
	throw new Error('Not implemented');
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData);

	try {
		switch (submission.context) {
			case 'validate':
			case 'submit': {
				const data = schema.parse(submission.value);

				if (submission.context === 'submit') {
					return await signup(data);
				}

				break;
			}
		}
	} catch (error) {
		submission.error.push(...formatError(error));
	}

	return json(submission);
}

export default function Signup() {
	const state = useActionData<typeof action>();
	const form = useForm<z.infer<typeof schema>>({
		mode: 'server-validation',
		initialReport: 'onBlur',
		state,
	});
	const { email, password, confirmPassword } = useFieldset(
		form.ref,
		form.config,
	);

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
