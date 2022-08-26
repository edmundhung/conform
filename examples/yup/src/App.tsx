import { useFieldset, useForm } from '@conform-to/react';
import { resolve } from '@conform-to/yup';
import * as yup from 'yup';

const schema = resolve(
	yup.object({
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
	}),
);

export default function SignupForm() {
	const formProps = useForm({
		validate: schema.validate,
		onSubmit: async (event) => {
			event.preventDefault();

			const formData = new FormData(event.currentTarget);
			const submission = schema.parse(formData);

			console.log(submission);
		},
	});
	const {
		email,
		password,
		'confirm-password': confirmPassword,
	} = useFieldset<yup.InferType<typeof schema.source>>(formProps.ref);

	return (
		<form {...formProps}>
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
