'use client';

import { useActionState } from 'react';
import { login } from './_action';
import { useForm } from '@conform-to/react/future';
import { validateLogin } from './_validation';

export function LoginForm() {
	const [lastResult, action] = useActionState(login, null);
	const { form, fields } = useForm({
		// Sync the result of last submission
		lastResult,
		shouldValidate: 'onBlur',
		// Reuse the validation logic on the client
		onValidate({ payload }) {
			return validateLogin(payload);
		},
	});

	return (
		<form {...form.props} action={action}>
			<div>
				<label>Email</label>
				<input
					type="text"
					className={fields.email.invalid ? 'error' : ''}
					name={fields.email.name}
					defaultValue={fields.email.defaultValue}
				/>
				<div>{fields.email.errors}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					type="password"
					className={fields.password.invalid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.password.errors}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input
						type="checkbox"
						name={fields.remember.name}
						defaultChecked={fields.remember.defaultValue === 'on'}
					/>
				</div>
			</label>
			<hr />
			<button>Login</button>
		</form>
	);
}
