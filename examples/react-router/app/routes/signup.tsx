import { useForm, parseSubmission, report } from '@conform-to/react/future';
import {
	coerceFormValue,
	memoize,
	formatResult,
} from '@conform-to/zod/v3/future';
import { useMemo } from 'react';
import { Form, redirect } from 'react-router';
import { z } from 'zod';
import type { Route } from './+types/signup';

const schema = coerceFormValue(
	z
		.object({
			username: z
				.string({ required_error: 'Username is required' })
				.regex(
					/^[a-zA-Z0-9]+$/,
					'Invalid username: only letters or numbers are allowed',
				),
			// .refine((username) => isUsernameUnique(username), {
			// 	message: 'Username is already used. How about "example"?',
			// }),
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
		),
);

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData);
	const result = schema.safeParse(submission.payload);

	if (!result.success) {
		return {
			result: report(submission, {
				error: formatResult(result),
			}),
		};
	}

	const isUsernameUnique = await new Promise<boolean>((resolve) => {
		setTimeout(() => {
			resolve(result.data.username === 'example');
		}, Math.random() * 1000);
	});

	if (!isUsernameUnique) {
		return {
			result: report(submission, {
				error: {
					fieldErrors: {
						username: ['Username is already used. How about "example"?'],
					},
				},
			}),
		};
	}

	if (Math.random() < 0.7) {
		return {
			result: report(submission, {
				error: {
					formErrors: ['Server error: Please try again later'],
				},
			}),
		};
	}

	throw redirect(`/?value=${JSON.stringify(result.data)}`);
}

export default function Signup({ actionData }: Route.ComponentProps) {
	const validateUsername = useMemo(
		() =>
			memoize(async function isUnique(username: string) {
				await new Promise((resolve) => {
					setTimeout(resolve, Math.random() * 500);
				});

				if (username !== 'example') {
					return ['Username is already used. How about "example"?'];
				}

				return null;
			}),
		[],
	);
	const { form, fields } = useForm({
		lastResult: actionData?.result,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		schema,
		async onValidate({ payload, error }) {
			if (typeof payload.username === 'string' && !error.fieldErrors.username) {
				const messages = await validateUsername(payload.username);

				if (messages) {
					error.fieldErrors.username = messages;
				}
			}

			return error;
		},
	});

	return (
		<Form {...form.props} method="post">
			<div className="form-error">{form.errors}</div>
			<label>
				<div>Username</div>
				<input
					type="text"
					className={fields.username.invalid ? 'error' : ''}
					name={fields.username.name}
					defaultValue={fields.username.defaultValue}
				/>
				<div>{fields.username.errors}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					type="password"
					className={fields.password.invalid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.password.errors}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					type="password"
					className={fields.confirmPassword.invalid ? 'error' : ''}
					name={fields.confirmPassword.name}
					defaultValue={fields.confirmPassword.defaultValue}
				/>
				<div>{fields.confirmPassword.errors}</div>
			</label>
			<hr />
			<button>Signup</button>
		</Form>
	);
}
