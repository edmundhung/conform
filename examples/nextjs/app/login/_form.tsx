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
				<label htmlFor={fields.email.id}>Email</label>
				<input
					id={fields.email.id}
					type="text"
					className={!fields.email.valid ? 'error' : ''}
					name={fields.email.name}
					defaultValue={fields.email.defaultValue}
					aria-invalid={!fields.email.ariaInvalid}
					aria-describedby={fields.email.ariaDescribedBy}
				/>
				<div id={fields.email.errorId}>{fields.email.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.password.id}>Password</label>
				<input
					id={fields.password.id}
					type="password"
					className={!fields.password.valid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
					aria-invalid={!fields.password.ariaInvalid}
					aria-describedby={fields.password.ariaDescribedBy}
				/>
				<div id={fields.password.errorId}>{fields.password.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.remember.id}>Remember me</label>
				<input
					id={fields.remember.id}
					type="checkbox"
					name={fields.remember.name}
					defaultChecked={fields.remember.defaultChecked}
					aria-invalid={!fields.remember.ariaInvalid}
					aria-describedby={fields.remember.ariaDescribedBy}
				/>
			</div>
			<hr />
			<button>Login</button>
		</form>
	);
}
