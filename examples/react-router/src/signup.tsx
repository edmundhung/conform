import type { Submission } from '@conform-to/react';
import { conform, useForm } from '@conform-to/react';
import { parse, refine } from '@conform-to/zod';
import type { ActionFunctionArgs } from 'react-router-dom';
import { Form, useActionData, json, redirect } from 'react-router-dom';
import { z } from 'zod';

// Instead of sharing a schema, prepare a schema creator
function createSchema(
	intent: string,
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
							when: intent === 'submit' || intent === 'validate/username',
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
		return json(submission);
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export function Component() {
	const lastSubmission = useActionData() as Submission;
	const [form, { username, password, confirmPassword }] = useForm({
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, {
				// Create the schema without any constraint defined
				schema: (intent) => createSchema(intent),
			});
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<Form method="post" {...form.props}>
			<label>
				<div>Username</div>
				<input
					className={username.error ? 'error' : ''}
					{...conform.input(username)}
				/>
				<div>{username.error}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					className={password.error ? 'error' : ''}
					{...conform.input(password, { type: 'password' })}
				/>
				<div>{password.error}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					className={confirmPassword.error ? 'error' : ''}
					{...conform.input(confirmPassword, { type: 'password' })}
				/>
				<div>{confirmPassword.error}</div>
			</label>
			<hr />
			<button>Signup</button>
		</Form>
	);
}
