import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/yup';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import * as yup from 'yup';

const schema = yup.object({
	email: yup
		.string()
		.required('Email is required')
		.email('Please enter a valid email'),
	password: yup
		.string()
		.required('Password is required')
		.min(10, 'The password should be at least 10 characters long'),
	confirmPassword: yup
		.string()
		.required('Confirm Password is required')
		.equals([yup.ref('password')], 'Password does not match'),
});

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	if (!submission.value || submission.intent !== 'submit') {
		return json({
			...submission,
			payload: {
				email: submission.payload.email,
			},
		});
	}

	throw new Error('Not implemented');
}

export default function SignupForm() {
	const state = useActionData<typeof action>();
	const [form, { email, password, confirmPassword }] = useForm({
		state,
		initialReport: 'onBlur',
		onValidate({ formData }) {
			return parse(formData, { schema });
		},
	});

	return (
		<Form method="post" {...form.props}>
			<label>
				<div>Email</div>
				<input
					className={email.error ? 'error' : ''}
					{...conform.input(email.config)}
				/>
				<div>{email.error}</div>
			</label>
			<div>
				<label>Password</label>
				<input
					className={password.error ? 'error' : ''}
					{...conform.input(password.config, { type: 'password' })}
				/>
				<div>{password.error}</div>
			</div>
			<div>
				<label>Confirm Password</label>
				<input
					className={confirmPassword.error ? 'error' : ''}
					{...conform.input(confirmPassword.config, { type: 'password' })}
				/>
				<div>{confirmPassword.error}</div>
			</div>
			<button>Login</button>
		</Form>
	);
}
