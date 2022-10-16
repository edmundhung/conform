import { useForm, useFieldset, isFieldElement } from '@conform-to/react';

export default function SignupForm() {
	const form = useForm({
		onValidate({ formData, form }) {
			for (const field of Array.from(form.elements)) {
				if (isFieldElement(field)) {
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
							} else if (field.value !== formData.get('password')) {
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

			switch (submission.type) {
				case 'validate':
					break;
				default:
					console.log(submission);
					break;
			}
		},
	});
	const {
		email,
		password,
		'confirm-password': confirmPassword,
	} = useFieldset(form.ref);

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
