import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

function createSchema(
	intent: string,
	constarint?: {
		isUsernameUnique: (username: string) => Promise<boolean>;
	},
) {
	return z
		.object({
			email: z.string().min(1, 'Email is required').email('Email is invalid'),
			username: z
				.string()
				.min(1, 'Username is required')
				.regex(
					/^[a-zA-Z0-9]+$/,
					'Invalid username: only letters or numbers are allowed',
				)
				.superRefine((value, ctx) => {
					if (intent !== 'submit' && intent !== 'validate/username') {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: conform.VALIDATION_SKIPPED,
						});
					} else if (typeof constarint?.isUsernameUnique === 'undefined') {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: conform.VALIDATION_UNDEFINED,
						});
					} else {
						return constarint.isUsernameUnique(value).then((valid) => {
							if (valid) {
								return;
							}

							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message: 'Username is already used',
							});
						});
					}
				}),
			password: z.string().min(1, 'Password is required'),
			confirmPassword: z.string().min(1, 'Confirm Password is required'),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: 'Password does not match',
			path: ['confirmPassword'],
		});
}

type Schema = z.input<ReturnType<typeof createSchema>>;

async function signup(data: Schema): Promise<Response> {
	throw new Error('Not implemented');
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = await parse(formData, {
		schema: (intent) =>
			createSchema(intent, {
				isUsernameUnique(username) {
					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(username !== 'edmundhung');
						}, Math.random() * 200);
					});
				},
			}),
		async: true,
	});

	if (!submission.value || submission.intent !== 'submit') {
		return json({
			...submission,
			payload: {
				email: submission.payload.email,
			},
		});
	}

	return await signup(submission.value);
}

export default function Signup() {
	const state = useActionData<typeof action>();
	const [form, { email, username, password, confirmPassword }] =
		useForm<Schema>({
			initialReport: 'onBlur',
			state,
			onValidate({ formData }) {
				return parse(formData, { schema: (intent) => createSchema(intent) });
			},
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
