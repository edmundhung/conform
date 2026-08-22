import {
	parseSubmission,
	report,
	type FormError,
	useForm,
} from '@conform-to/react/future';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn, useServerFn } from '@tanstack/react-start';
import { useState } from 'react';

function validate(value: Record<string, unknown>) {
	const error: FormError<string> = {
		formErrors: null,
		fieldErrors: {},
	};

	if (!value.email) {
		error.fieldErrors.email = 'Email is required';
	} else if (typeof value.email !== 'string' || !value.email.includes('@')) {
		error.fieldErrors.email = 'Email is invalid';
	}

	if (!value.password) {
		error.fieldErrors.password = 'Password is required';
	}

	return error.formErrors === null &&
		Object.keys(error.fieldErrors).length === 0
		? null
		: error;
}

const login = createServerFn({ method: 'POST' })
	.validator((formData: FormData) => parseSubmission(formData))
	.handler(async ({ data: submission }) => {
		const error = validate(submission.payload);

		if (error) {
			return report(submission, { error });
		}

		throw redirect({
			to: '/',
			search: { value: JSON.stringify(submission.payload) },
		});
	});

export const Route = createFileRoute('/login')({ component: Login });

function Login() {
	const submit = useServerFn(login);
	const [lastResult, setLastResult] =
		useState<Awaited<ReturnType<typeof login>>>();
	const { form, fields } = useForm({
		lastResult,
		async onSubmit(event, { formData }) {
			event.preventDefault();
			const result = await submit({ data: formData });

			if (result) {
				setLastResult(result);
			}
		},
		shouldValidate: 'onBlur',
		onValidate({ payload }) {
			return validate(payload);
		},
	});

	return (
		<form {...form.props}>
			<div>
				<label htmlFor={fields.email.id}>Email</label>
				<input
					id={fields.email.id}
					type="email"
					className={!fields.email.valid ? 'error' : ''}
					name={fields.email.name}
					defaultValue={fields.email.defaultValue}
					aria-invalid={!fields.email.valid || undefined}
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
					aria-invalid={!fields.password.valid || undefined}
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
				/>
			</div>
			<hr />
			<button>Login</button>
		</form>
	);
}
