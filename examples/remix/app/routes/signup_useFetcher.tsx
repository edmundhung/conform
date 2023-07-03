import { conform, useForm } from '@conform-to/react';
import { parse, refine } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useActionData, useFetcher } from '@remix-run/react';
import { z } from 'zod';

// Instead of sharing a schema, prepare a schema creator
function createSchema(
	intent: string,
	constarint: {
		// isUsernameUnique is only defined on the server
		isUsernameUnique?: (username: string) => Promise<boolean>;
	} = {},
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
				.superRefine((username, ctx) =>
					refine(ctx, {
						validate: () => constarint.isUsernameUnique?.(username),
						when: intent === 'submit' || intent === 'validate/username',
						message: 'Username is already used',
					}),
				),
			password: z.string().min(1, 'Password is required'),
			confirmPassword: z.string().min(1, 'Confirm Password is required'),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: 'Password does not match',
			path: ['confirmPassword'],
		});
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

export default function Signup() {
	const fetcher = useFetcher<typeof action>();
	const actionData = useActionData<typeof action>();
	const [form, { username, password, confirmPassword }] = useForm({
		lastSubmission: fetcher.data ?? actionData,
		onValidate({ formData }) {
			return parse(formData, {
				// Create the schema without any constraint defined
				schema: (intent) => createSchema(intent),
			});
		},
	});

	return (
		<fetcher.Form method="post" {...form.props}>
			<div className="form-error">{form.error}</div>
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
			<button type="submit">Signup</button>
		</fetcher.Form>
	);
}
