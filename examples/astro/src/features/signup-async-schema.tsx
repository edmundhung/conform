import {
	memoize,
	parseSubmission,
	report,
	useForm,
	type SubmissionResult,
} from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v3/future';
import { useMemo } from 'react';
import { z } from 'zod';

type SignupAsyncSchemaFormProps = {
	action: string;
	lastResult?: SubmissionResult | null;
};

export function createSignupAsyncSchema(checks: {
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

export async function signupWithAsyncSchema(formData: FormData) {
	const schema = createSignupAsyncSchema({
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
			success: false as const,
			result: report(submission, {
				hideFields: ['password', 'confirmPassword'],
				error: {
					issues: result.error.issues,
				},
			}),
		};
	}

	if (result.data.password !== 'secret') {
		return {
			success: false as const,
			result: report(submission, {
				hideFields: ['password', 'confirmPassword'],
				error: {
					formErrors: ['Server error: Please try again later'],
				},
			}),
		};
	}

	return {
		success: true as const,
		redirectTo: `/?value=${encodeURIComponent(JSON.stringify(result.data))}`,
	};
}

export function SignupAsyncSchemaForm({
	action,
	lastResult = null,
}: SignupAsyncSchemaFormProps) {
	const schema = useMemo(
		() =>
			createSignupAsyncSchema({
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
		lastResult,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	});

	return (
		<form {...form.props} method="post" action={action}>
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
		</form>
	);
}
