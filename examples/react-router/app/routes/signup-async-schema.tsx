import {
	useForm,
	parseSubmission,
	memoize,
	report,
} from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v3/future';
import { useMemo } from 'react';
import { Form, redirect } from 'react-router';
import { z } from 'zod';
import type { Route } from './+types/signup';

// Instead of sharing a schema, prepare a schema creator
export function createSignupSchema(checks: {
	isUsernameUnique: (username: string) => Promise<boolean>;
}) {
	const isUsernameUnique = memoize(checks.isUsernameUnique);

	return coerceFormValue(
		z
			.object({
				username: z
					.string({ required_error: 'Username is required' })
					.regex(
						/^[a-zA-Z0-9]+$/,
						'Invalid username: only letters or numbers are allowed',
					)
					.refine((username) => isUsernameUnique(username), {
						message: 'Username is already used. How about "example"?',
					}),
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
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const schema = createSignupSchema({
		isUsernameUnique(username) {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(username === 'example');
				}, Math.random() * 1000);
			});
		},
	});
	const submission = parseSubmission(formData);
	const result = await schema.safeParseAsync(submission.payload);

	if (!result.success) {
		return {
			result: report(submission, {
				error: {
					issues: result.error.issues,
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
	const schema = useMemo(
		() =>
			createSignupSchema({
				async isUsernameUnique(username) {
					await new Promise((resolve) => {
						setTimeout(resolve, Math.random() * 500);
					});

					return username === 'example';
				},
			}),
		[],
	);
	const { form, fields } = useForm(schema, {
		lastResult: actionData?.result,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	});

	return (
		<Form {...form.props} method="post">
			<div className="form-error">{form.errors}</div>
			<label>
				<div>Username</div>
				<input
					type="text"
					className={!fields.username.valid ? 'error' : ''}
					name={fields.username.name}
					defaultValue={fields.username.defaultValue}
				/>
				<div>{fields.username.errors}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					type="password"
					className={!fields.password.valid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.password.errors}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					type="password"
					className={!fields.confirmPassword.valid ? 'error' : ''}
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
