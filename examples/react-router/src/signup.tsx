import type { Submission } from '@conform-to/react';
import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionFunctionArgs } from 'react-router-dom';
import { Form, useActionData, json } from 'react-router-dom';
import { z } from 'zod';

// Instead of sharing a schema, prepare a schema creator
function createSchema(
	intent: string,
	// Note: the constraints parameter is optional
	constarint?: {
		isUsernameUnique: (username: string) => Promise<boolean>;
	},
) {
	return z
		.object({
			username: z
				.string()
				.min(1, 'Username is required')
				.regex(
					/^[a-zA-Z0-9]+$/,
					'Invalid username: only letters or numbers are allowed',
				)
				// We use `.superRefine` instead of `.refine` for better control
				.superRefine((value, ctx) => {
					if (intent !== 'submit' && intent !== 'validate/username') {
						// Validate only when necessary
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: conform.VALIDATION_SKIPPED,
						});
					} else if (typeof constarint?.isUsernameUnique === 'undefined') {
						// Validate only if the constraint is defined
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: conform.VALIDATION_UNDEFINED,
						});
					} else {
						// Tell zod it is an async validation by returning a promise
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

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = await parse(formData, {
		schema: (intent) =>
			// create the zod schema with the intent and constraint
			createSchema(intent, {
				isUsernameUnique(username) {
					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(username !== 'admin');
						}, Math.random() * 300);
					});
				},
			}),
		async: true,
	});

	if (!submission.value || submission.intent !== 'submit') {
		return json({
			...submission,
			payload: {
				username: submission.payload.username,
			},
		});
	}

	throw new Error('Not implemented');
}

export function Component() {
	const lastSubmission = useActionData() as Submission;
	const [form, { username, password, confirmPassword }] = useForm<
		z.input<ReturnType<typeof createSchema>>
	>({
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, {
				// Create the schema without any constraint defined
				schema: (intent) => createSchema(intent),
			});
		},
	});

	return (
		<Form method="post" {...form.props}>
			<div className="form-error">{form.error}</div>
			<label>
				<div>Username</div>
				<input
					className={username.error ? 'error' : ''}
					type="text"
					name="username"
				/>
				<div>{username.error}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					className={password.error ? 'error' : ''}
					type="password"
					name="password"
				/>
				<div>{password.error}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					className={confirmPassword.error ? 'error' : ''}
					type="password"
					name="confirmPassword"
				/>
				<div>{confirmPassword.error}</div>
			</label>
			<hr />
			<button type="submit">Signup</button>
		</Form>
	);
}
