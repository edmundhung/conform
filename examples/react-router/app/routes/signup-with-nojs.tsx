import { useForm, parseSubmission, report } from '@conform-to/react/future';
import { coerceFormValue, resolveZodResult } from '@conform-to/zod/v3/future';
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
	const result = schema.safeParse(submission.value);

	let error = resolveZodResult(result);

	if (!error?.fieldErrors.username) {
		const isUsernameUnique = await new Promise<boolean>((resolve) => {
			setTimeout(() => {
				resolve(submission.value.username === 'example');
			}, Math.random() * 1000);
		});

		if (!isUsernameUnique) {
			error ??= { formErrors: null, fieldErrors: {} };
			error.fieldErrors.username = [
				'Username is already used. How about "example"?',
			];
		}
	}

	if (!result.success || error || submission.intent) {
		return {
			result: report(submission, {
				error,
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
	const { form, fields } = useForm({
		lastResult: actionData?.result,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		schema,
		onValidate(_, { error, intent }) {
			// If there is client error, use it
			if (error.fieldErrors.username) {
				return error;
			}

			// Fallback to server validation if we are validating username specifically
			if (intent?.type === 'validate' && intent.payload === 'username') {
				return undefined;
			}

			// Otherwise, copy username error assuming it was validated on the server
			error.fieldErrors.username = form.fieldErrors.username;

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
