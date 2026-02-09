'use client';

import { useActionState, useMemo } from 'react';
import { signupAsyncSchema } from './_action';
import { useForm } from '@conform-to/react/future';
import { createSignupSchema } from '../signup/_schema';

export function SignupAsyncSchemaForm() {
	const [lastResult, action] = useActionState(signupAsyncSchema, null);
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
	const { form, fields } = useForm(schema, {
		lastResult,
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
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
