import {
	conform,
	parse,
	useFieldset,
	useForm,
	hasError,
	shouldValidate,
} from '@conform-to/react';
import { formatError } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

const schema = z
	.object({
		email: z.string().min(1, 'Email is required').email('Email is invalid'),
		username: z
			.string()
			.min(1, 'Username is required')
			.regex(
				/^[a-zA-Z0-9]+$/,
				'Invalid username: only letters or numbers are allowed',
			),
		password: z.string().min(1, 'Password is required'),
		confirmPassword: z.string().min(1, 'Confirm Password is required'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Password does not match',
		path: ['confirmPassword'],
	});

async function isUsernameUnique(username: string): Promise<boolean> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(username !== 'edmundhung');
		}, Math.random() * 200);
	});
}

async function signup(data: z.infer<typeof schema>): Promise<Response> {
	throw new Error('Not implemented');
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData);

	try {
		switch (submission.context) {
			case 'validate':
			case 'submit': {
				const data = await schema
					.refine(
						async ({ username }) => {
							if (!shouldValidate(submission, 'username')) {
								return true;
							}

							return await isUsernameUnique(username);
						},
						{
							message: 'Username is already used',
							path: ['username'],
						},
					)
					.parseAsync(submission.value);

				if (submission.context === 'submit') {
					return await signup(data);
				}

				break;
			}
		}
	} catch (error) {
		submission.error = submission.error.concat(formatError(error));
	}

	return json(submission);
}

export default function Signup() {
	const state = useActionData<typeof action>();
	const form = useForm<z.infer<typeof schema>>({
		mode: 'server-validation',
		initialReport: 'onBlur',
		state,
		onValidate({ submission }) {
			const result = schema.safeParse(submission.value);

			if (result.success) {
				return [];
			}

			return formatError(result.error);
		},
		onSubmit(event, { submission }) {
			// Only the email field requires additional validation from the server
			// We trust the client result otherwise
			if (
				submission.context === 'validate' &&
				(submission.intent !== 'username' ||
					hasError(submission.error, 'username'))
			) {
				event.preventDefault();
			}
		},
	});
	const { email, username, password, confirmPassword } = useFieldset(
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
					<div>Username</div>
					<input
						className={username.error ? 'error' : ''}
						{...conform.input(username.config)}
					/>
					<div>{username.error}</div>
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
