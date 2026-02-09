import {
	type FormError,
	parseSubmission,
	report,
	useForm,
} from '@conform-to/react/future';
import { Form, redirect } from 'react-router';
import type { Route } from './+types/login';

function validate(value: Record<string, unknown>) {
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

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData);
	const error = validate(submission.payload);

	if (error) {
		return {
			result: report(submission, {
				error,
			}),
		};
	}

	throw redirect(`/?value=${JSON.stringify(submission.payload)}`);
}

export default function Login({ actionData }: Route.ComponentProps) {
	const { form, fields } = useForm({
		// Sync the result of last submission
		lastResult: actionData?.result,
		shouldValidate: 'onBlur',
		// Reuse the validation logic on the client
		onValidate({ payload }) {
			return validate(payload);
		},
	});

	return (
		<Form method="post" {...form.props}>
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
		</Form>
	);
}
