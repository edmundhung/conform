import type { SubmissionResult, Intent } from '@conform-to/react';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod, refine } from '@conform-to/zod';
import type { ActionFunctionArgs } from 'react-router-dom';
import { Form, useActionData, json, redirect } from 'react-router-dom';
import { z } from 'zod';

// Instead of sharing a schema, prepare a schema creator
function createSchema(
	intent: Intent | null,
	constraint: {
		// isUsernameUnique is only defined on the server
		isUsernameUnique?: (username: string) => Promise<boolean>;
	} = {},
) {
	return z
		.object({
			username: z
				.string({ required_error: 'Username is required' })
				.regex(
					/^[a-zA-Z0-9]+$/,
					'Invalid username: only letters or numbers are allowed',
				)
				// Pipe the schema so it runs only if the username is valid
				.pipe(
					z.string().superRefine((username, ctx) =>
						refine(ctx, {
							validate: () => constraint.isUsernameUnique?.(username),
							when:
								!intent ||
								(intent.type === 'validate' &&
									intent.payload.name === 'username'),
							message: 'Username is already used',
						}),
					),
				),
		})
		.and(
			z
				.object({
					password: z.string({ required_error: 'Password is required' }),
					confirmPassword: z.string({
						required_error: 'Confirm password is required',
					}),
				})
				.refine((data) => data.password === data.confirmPassword, {
					message: 'Password does not match',
					path: ['confirmPassword'],
				}),
		);
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = await parseWithZod(formData, {
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

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export function Component() {
	const lastResult = useActionData() as SubmissionResult<string[]>;
	const { form, fieldset } = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, {
				// Create the schema without any constraint defined
				schema: (intent) => createSchema(intent),
			});
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<label>
				<div>Username</div>
				<input
					className={!fieldset.username.valid ? 'error' : ''}
					{...getInputProps(fieldset.username)}
				/>
				<div>{fieldset.username.errors}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					className={!fieldset.password.valid ? 'error' : ''}
					{...getInputProps(fieldset.password, { type: 'password' })}
				/>
				<div>{fieldset.password.errors}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					className={!fieldset.confirmPassword.valid ? 'error' : ''}
					{...getInputProps(fieldset.confirmPassword, { type: 'password' })}
				/>
				<div>{fieldset.confirmPassword.errors}</div>
			</label>
			<hr />
			<button>Signup</button>
		</Form>
	);
}
