import {
	parseSubmission,
	report,
	useForm,
	type FormError,
	type SubmissionResult,
} from '@conform-to/react/future';

type LoginFormProps = {
	action: string;
	lastResult?: SubmissionResult | null;
};

export function validateLogin(
	value: Record<string, unknown>,
): FormError | null {
	const error: FormError = {
		formErrors: [],
		fieldErrors: {},
	};

	if (!value.email) {
		error.fieldErrors.email = ['Email is required'];
	} else if (typeof value.email !== 'string' || !value.email.includes('@')) {
		error.fieldErrors.email = ['Email is invalid'];
	}

	if (!value.password) {
		error.fieldErrors.password = ['Password is required'];
	}

	if (
		error.formErrors.length === 0 &&
		Object.values(error.fieldErrors).every((message) => message.length === 0)
	) {
		return null;
	}

	return error;
}

export async function login(formData: FormData) {
	const submission = parseSubmission(formData);
	const error = validateLogin(submission.payload);

	if (error) {
		return {
			success: false as const,
			result: report(submission, {
				error,
			}),
		};
	}

	return {
		success: true as const,
		redirectTo: `/?value=${encodeURIComponent(JSON.stringify(submission.payload))}`,
	};
}

export function LoginForm({ action, lastResult = null }: LoginFormProps) {
	const { form, fields } = useForm({
		lastResult,
		shouldValidate: 'onBlur',
		onValidate({ payload }) {
			return validateLogin(payload);
		},
	});

	return (
		<form {...form.props} method="post" action={action}>
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
					aria-invalid={!fields.remember.valid || undefined}
					aria-describedby={fields.remember.ariaDescribedBy}
				/>
			</div>
			<hr />
			<button>Login</button>
		</form>
	);
}
