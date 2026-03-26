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

type SignupFormProps = {
	action: string;
	lastResult?: SubmissionResult | null;
};

export const signupSchema = coerceFormValue(
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

export async function validateUsername(
	username: string,
): Promise<string[] | null> {
	await new Promise((resolve) => {
		setTimeout(resolve, Math.random() * 500);
	});

	if (username !== 'example') {
		return ['Username is already used. How about "example"?'];
	}

	return null;
}

export async function validateSignupServer(data: {
	username: string;
	password: string;
}): Promise<
	| {
			fieldErrors: {
				username: string[];
			};
			formErrors: [];
	  }
	| {
			fieldErrors: {};
			formErrors: string[];
	  }
	| null
> {
	const usernameErrors = await validateUsername(data.username);

	if (usernameErrors) {
		return {
			fieldErrors: {
				username: usernameErrors,
			},
			formErrors: [],
		};
	}

	if (data.password !== 'secret') {
		return {
			fieldErrors: {},
			formErrors: ['Server error: Please try again later'],
		};
	}

	return null;
}

export async function signup(formData: FormData) {
	const submission = parseSubmission(formData);
	const result = signupSchema.safeParse(submission.payload);

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

	const error = await validateSignupServer(result.data);

	if (error) {
		return {
			success: false as const,
			result: report(submission, {
				hideFields: ['password', 'confirmPassword'],
				error,
			}),
		};
	}

	return {
		success: true as const,
		redirectTo: `/?value=${encodeURIComponent(JSON.stringify(result.data))}`,
	};
}

export function SignupForm({ action, lastResult = null }: SignupFormProps) {
	const checkUsername = useMemo(() => memoize(validateUsername), []);

	const { form, fields } = useForm(signupSchema, {
		lastResult,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		async onValidate({ payload, error }) {
			if (typeof payload.username === 'string' && !error.fieldErrors.username) {
				const messages = await checkUsername(payload.username);

				if (messages) {
					error.fieldErrors.username = messages;
				}
			}

			return error;
		},
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
