'use client';

import { memoize } from '@conform-to/zod/v3/future';
import { useActionState, useMemo } from 'react';
import { useForm } from '@conform-to/react/future';
import { signup } from './_action';
import { signupSchema } from './_schema';

export function SignupForm() {
	const [lastResult, action] = useActionState(signup, null);
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
		lastResult,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		schema: signupSchema,
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
		<form {...form.props} action={action}>
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
