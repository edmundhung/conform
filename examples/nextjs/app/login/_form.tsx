'use client';

import { resolveZodResult } from 'conform-zod';
import { useActionState } from 'react';
import { login } from './_action';
import { loginSchema } from './_schema';
import { useForm } from '@/app/_template';

export function LoginForm() {
	const [lastResult, action] = useActionState(login, null);
	const { form, fields } = useForm({
		// Sync the result of last submission
		lastResult,
		// Reuse the validation logic on the client
		onValidate(value) {
			return resolveZodResult(loginSchema.safeParse(value));
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
				<div>{fields.email.error}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					type="password"
					className={fields.password.invalid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.password.error}</div>
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
