'use client';

import { useActionState, useMemo } from 'react';
import { useForm, memoize } from '@conform-to/react/future';
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
	const { form, fields } = useForm(signupSchema, {
		lastResult,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
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
