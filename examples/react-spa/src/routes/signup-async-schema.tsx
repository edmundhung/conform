import { useForm, memoize } from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v3/future';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';

// Schema creator that accepts async validation dependencies
function createSignupSchema(checks: {
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

async function handleSignup(
	value: z.infer<ReturnType<typeof createSignupSchema>>,
) {
	await new Promise((resolve) => {
		setTimeout(resolve, Math.random() * 1000);
	});

	if (value?.password !== 'secret') {
		return 'Signup failed. The password must be "secret".';
	}

	return null;
}

export default function SignupAsyncSchema() {
	const navigate = useNavigate();
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
	const { form, fields } = useForm({
		schema,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		async onSubmit(event, { value, update }) {
			event.preventDefault();

			const error = await handleSignup(value);

			if (error) {
				update({
					error: {
						formErrors: [error],
					},
				});
			} else {
				navigate(`/?value=${encodeURIComponent(JSON.stringify(value))}`);
			}
		},
	});

	return (
		<form {...form.props} method="post">
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
		</form>
	);
}
