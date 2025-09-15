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
				<label>Email</label>
				<input
					type="email"
					className={!fields.email.valid ? 'error' : ''}
					name={fields.email.name}
					defaultValue={fields.email.defaultValue}
				/>
				<div>{fields.email.errors}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					type="password"
					className={!fields.password.valid ? 'error' : ''}
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
						defaultChecked={fields.remember.defaultChecked}
					/>
				</div>
			</label>
			<hr />
			<button>Login</button>
		</Form>
	);
}
