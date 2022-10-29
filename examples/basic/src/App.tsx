import {
	useForm,
	useFieldset,
	parse,
	getFormElements,
} from '@conform-to/react';

export default function LoginForm() {
	const form = useForm({
		initialReport: 'onBlur',
		onValidate({ form, formData }) {
			const submission = parse(formData);

			for (const element of getFormElements(form)) {
				switch (element.name) {
					case 'email': {
						if (element.validity.valueMissing) {
							submission.error.push([element.name, 'Email is required']);
						} else if (element.validity.typeMismatch) {
							submission.error.push([element.name, 'Email is invalid']);
						} else if (!element.value.endsWith('gmail.com')) {
							submission.error.push([element.name, 'Only gmail is accepted']);
						}
						break;
					}
					case 'password': {
						if (element.validity.valueMissing) {
							submission.error.push([element.name, 'Password is required']);
						}
						break;
					}
				}
			}

			return submission;
		},
		onSubmit(event, { formData }) {
			event.preventDefault();

			console.log(Object.fromEntries(formData));
		},
	});
	const { email, password } = useFieldset(form.ref, form.config);

	return (
		<form {...form.props}>
			<label>
				<div>Email</div>
				<input type="email" name="email" required autoComplete="off" />
				<div>{email.error}</div>
			</label>
			<label>
				<div>Password</div>
				<input type="password" name="password" required />
				<div>{password.error}</div>
			</label>
			<label>
				<div>
					<span>Remember me</span>
					<input type="checkbox" name="remember-me" value="yes" />
				</div>
			</label>
			<button type="submit">Login</button>
		</form>
	);
}
