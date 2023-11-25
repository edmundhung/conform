import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parse, refine } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
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

export async function action({ request }: ActionArgs) {
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

	if (!submission.value) {
		return json(submission.reject());
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export default function Signup() {
	const lastResult = useActionData<typeof action>();
	const form = useForm({
		lastResult,
		onValidate({ formData }) {
			return parse(formData, {
				// Create the schema without any constraint defined
				schema: (intent) => createSchema(intent),
			});
		},
		shouldValidate: 'onBlur',
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<label>
				<div>Username</div>
				<input
					className={!form.fields.username.valid ? 'error' : ''}
					{...getInputProps(form.fields.username)}
				/>
				<div>{form.fields.username.errors}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					className={!form.fields.password.valid ? 'error' : ''}
					{...getInputProps(form.fields.password, { type: 'password' })}
				/>
				<div>{form.fields.password.errors}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					className={!form.fields.confirmPassword.valid ? 'error' : ''}
					{...getInputProps(form.fields.confirmPassword, { type: 'password' })}
				/>
				<div>{form.fields.confirmPassword.errors}</div>
			</label>
			<hr />
			<button>Signup</button>
		</Form>
	);
}
