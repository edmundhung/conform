import { useForm, useFieldset, isFieldElement } from '@conform-to/react';

interface Signup {
	email: string;
	password: string;
	'confirm-password': string;
}

export default function SignupForm() {
	const form = useForm<Signup>({
		onValidate({ form, submission }) {
			for (const field of Array.from(form.elements)) {
				if (isFieldElement(field) && submission.scope.includes(field.name)) {
					switch (field.name) {
						case 'email':
							if (field.validity.valueMissing) {
								field.setCustomValidity('Email is required');
							} else if (field.validity.typeMismatch) {
								field.setCustomValidity('Please enter a valid email');
							} else {
								field.setCustomValidity('');
							}
							break;
						case 'password':
							if (field.validity.valueMissing) {
								field.setCustomValidity('Password is required');
							} else if (field.validity.tooShort) {
								field.setCustomValidity(
									'The password should be at least 10 characters long',
								);
							} else {
								field.setCustomValidity('');
							}
							break;
						case 'confirm-password': {
							if (field.validity.valueMissing) {
								field.setCustomValidity('Confirm Password is required');
							} else if (field.value !== submission.value.password) {
								field.setCustomValidity('The password does not match');
							} else {
								field.setCustomValidity('');
							}
							break;
						}
					}
				}
			}

			return form.reportValidity();
		},
		onSubmit(event, { submission }) {
			event.preventDefault();

			if (submission.type !== 'validate') {
				console.log(submission);
			}
		},
	});
	const {
		email,
		password,
		'confirm-password': confirmPassword,
	} = useFieldset(form.ref, form.config);

	return (
		<form {...form.props}>
			<label>
				<div>Email</div>
				<input type="email" name="email" required autoComplete="off" />
				<div>{email.error}</div>
			</label>
			<label>
				<div>Password</div>
				<input type="password" name="password" required minLength={10} />
				<div>{password.error}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input type="password" name="confirm-password" required />
				<div>{confirmPassword.error}</div>
			</label>
			<button type="submit">Login</button>
		</form>
	);
}
