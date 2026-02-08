import { useForm, parseSubmission, report } from '@conform-to/react/future';
import { coerceFormValue, formatResult } from '@conform-to/zod/v3/future';
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
	const result = schema.safeParse(submission.payload);

	let error = formatResult(result);

	if (!error?.fieldErrors.username) {
		const isUsernameUnique = await new Promise<boolean>((resolve) => {
			setTimeout(() => {
				resolve(submission.payload.username === 'example');
			}, Math.random() * 1000);
		});

		if (!isUsernameUnique) {
			error ??= { formErrors: [], fieldErrors: {} };
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

	if (result.data.password !== 'secret') {
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
	const { form, fields } = useForm(schema, {
		lastResult: actionData?.result,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate({ error, intent }) {
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
			<div>
				<label htmlFor={fields.username.id}>Username</label>
				<input
					id={fields.username.id}
					type="text"
					className={!fields.username.valid ? 'error' : ''}
					name={fields.username.name}
					defaultValue={fields.username.defaultValue}
					aria-invalid={!fields.username.valid || undefined}
					aria-describedby={fields.username.ariaDescribedBy}
				/>
				<div id={fields.username.errorId}>{fields.username.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.password.id}>Password</label>
				<input
					id={fields.password.id}
					type="password"
					className={!fields.password.valid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
					aria-invalid={!fields.password.valid || undefined}
					aria-describedby={fields.password.ariaDescribedBy}
				/>
				<div id={fields.password.errorId}>{fields.password.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.confirmPassword.id}>Confirm Password</label>
				<input
					id={fields.confirmPassword.id}
					type="password"
					className={!fields.confirmPassword.valid ? 'error' : ''}
					name={fields.confirmPassword.name}
					defaultValue={fields.confirmPassword.defaultValue}
					aria-invalid={!fields.confirmPassword.valid || undefined}
					aria-describedby={fields.confirmPassword.ariaDescribedBy}
				/>
				<div id={fields.confirmPassword.errorId}>
					{fields.confirmPassword.errors}
				</div>
			</div>
			<hr />
			<button>Signup</button>
		</Form>
	);
}
