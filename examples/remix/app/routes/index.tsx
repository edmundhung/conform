import { conform, parse, useForm } from '@conform-to/react';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';

interface SignupForm {
	email: string;
	password: string;
	confirmPassword: string;
}

function parseFormData(formData: FormData) {
	return parse(formData, {
		resolve({ email, password, confirmPassword }) {
			const error: Record<string, string> = {};

			if (!email) {
				error.email = 'Email is required';
			} else if (!email.includes('@')) {
				error.email = 'Email is invalid';
			}

			if (!password) {
				error.password = 'Password is required';
			}

			if (!confirmPassword) {
				error.confirmPassword = 'Confirm password is required';
			} else if (confirmPassword !== password) {
				error.confirmPassword = 'Password does not match';
			}

			if (error.email || error.password || error.confirmPassword) {
				return { error };
			}

			// Return the value only if no error
			return {
				value: {
					email,
					password,
					confirmPassword,
				},
			};
		},
	});
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseFormData(formData);

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
	const lastSubmission = useActionData<typeof action>();
	const [form, { email, password, confirmPassword }] = useForm<SignupForm>({
		// Sync the result of last submission
		lastSubmission,

		// Reuse the validation logic on the client
		onValidate({ formData }) {
			return parseFormData(formData);
		},
	});

	return (
		<Form method="post" {...form.props}>
			<div>{form.error}</div>
			<div>
				<label>Email</label>
				<input
					className={email.error ? 'error' : ''}
					{...conform.input(email)}
				/>
				<div>{email.error}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					className={password.error ? 'error' : ''}
					{...conform.input(password, { type: 'password' })}
				/>
				<div>{password.error}</div>
			</div>
			<div>
				<label>Confirm Password</label>
				<input
					className={confirmPassword.error ? 'error' : ''}
					{...conform.input(confirmPassword, { type: 'password' })}
				/>
				<div>{confirmPassword.error}</div>
			</div>
			<button type="submit">Signup</button>
		</Form>
	);
}
