import { conform, parse, useForm } from '@conform-to/react';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';

interface SignupForm {
	email: string;
	password: string;
	confirmPassword: string;
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, {
		resolve({ email, password, confirmPassword }) {
			const error: Array<[string, string]> = [];

			if (!email) {
				error.push(['email', 'Email is required']);
			} else if (!email.includes('@')) {
				error.push(['email', 'Email is invalid']);
			}

			if (!password) {
				error.push(['password', 'Password is required']);
			}

			if (!confirmPassword) {
				error.push(['confirmPassword', 'Confirm password is required']);
			} else if (confirmPassword !== password) {
				error.push(['confirmPassword', 'Password does not match']);
			}

			if (error.length > 0) {
				return { error };
			}

			return {
				value: { email, password, confirmPassword },
			};
		},
	});

	/**
	 * Signup only when the user click on the submit button and no error found
	 */
	if (!submission.value || submission.intent !== 'submit') {
		// Always sends the submission state back to client until the user is signed up
		return json({
			...submission,
			payload: {
				// Never send the password back to client
				email: submission.payload.email,
			},
		});
	}

	throw new Error('Not implemented');
}

export default function Signup() {
	// Last submission returned by the server
	const state = useActionData<typeof action>();
	const [form, { email, password, confirmPassword }] = useForm<SignupForm>({
		// Begin validating on blur
		initialReport: 'onBlur',

		// Sync the result of last submission
		state,
	});

	return (
		<Form method="post" {...form.props}>
			<div>{form.error}</div>
			<div>
				<label>Email</label>
				<input
					className={email.error ? 'error' : ''}
					{...conform.input(email.config)}
				/>
				<div>{email.error}</div>
			</div>
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
			<button type="submit">Signup</button>
		</Form>
	);
}
