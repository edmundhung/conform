import { useFieldset, useForm, reportValidity } from '@conform-to/react';
import { getError } from '@conform-to/yup';
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
	'confirm-password': yup
		.string()
		.required('Confirm Password is required')
		.equals([yup.ref('password')], 'The password does not match'),
});

export default function SignupForm() {
	const form = useForm({
		onValidate({ form, submission }) {
			try {
				schema.validateSync(submission.value, {
					abortEarly: false,
				});
			} catch (error) {
				if (error instanceof yup.ValidationError) {
					submission.error = submission.error.concat(
						getError(error, submission.scope),
					);
				} else {
					submission.error = submission.error.concat([
						['', 'Validation failed'],
					]);
				}
			}

			return reportValidity(form, submission);
		},
		onSubmit: async (event, context) => {
			event.preventDefault();

			console.log(context);
		},
	});
	const {
		email,
		password,
		'confirm-password': confirmPassword,
	} = useFieldset<yup.InferType<typeof schema>>(form.ref);

	return (
		<form {...form.props}>
			<label>
				<div>Email</div>
				<input type="email" name="email" />
				<div>{email.error}</div>
			</label>
			<label>
				<div>Password</div>
				<input type="password" name="password" />
				<div>{password.error}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input type="password" name="confirm-password" />
				<div>{confirmPassword.error}</div>
			</label>
			<div>
				<button type="submit">Login</button>
			</div>
		</form>
	);
}
