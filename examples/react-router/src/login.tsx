import type { Submission } from '@conform-to/react';
import { useForm, parse, validateConstraint } from '@conform-to/react';
import type { ActionFunctionArgs } from 'react-router-dom';
import { Form, useActionData } from 'react-router-dom';
import { json, redirect } from 'react-router-dom';

interface Login {
	email: string;
	password: string;
	remember: string;
}

async function isAuthenticated(email: string, password: string) {
	return new Promise((resolve) => {
		resolve(email === 'conform@example.com' && password === '12345');
	});
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parse(formData);

	if (
		!(await isAuthenticated(
			submission.payload.email,
			submission.payload.password,
		))
	) {
		return json({
			...submission,
			// '' denote the root which is treated as form error
			error: { '': 'Invalid credential' },
		});
	}

	return redirect('/');
}

export function Component() {
	const lastSubmission = useActionData() as Submission;
	const [form, { email, password }] = useForm<Login>({
		lastSubmission,
		shouldValidate: 'onBlur',
		onValidate(context) {
			return validateConstraint(context);
		},
	});

	return (
		<Form method="post" {...form.props}>
			<div className="form-error">{form.error}</div>
			<label>
				<div>Email</div>
				<input
					className={email.error ? 'error' : ''}
					name="email"
					type="email"
					required
					pattern="[^@]+@[^@]+\.[^@]+"
				/>
				{email.error === 'required' ? (
					<div>Email is required</div>
				) : email.error === 'type' || email.error === 'pattern' ? (
					<div>Email is invalid</div>
				) : null}
			</label>
			<label>
				<div>Password</div>
				<input
					className={password.error ? 'error' : ''}
					name="password"
					type="password"
					required
				/>
				{password.error === 'required' ? <div>Password is required</div> : null}
			</label>
			<label>
				<div>
					<span>Remember me</span>
					<input name="remember" type="checkbox" value="yes" />
				</div>
			</label>
			<hr />
			<button>Login</button>
		</Form>
	);
}
