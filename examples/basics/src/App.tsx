import { useForm, useFieldset } from '@conform-to/react';

export default function LoginForm() {
	const formProps = useForm({
		onSubmit(event) {
			event.preventDefault();

			const formData = new FormData(event.currentTarget);
			const result = Object.fromEntries(formData);

			console.log(result);
		},
	});
	const { email, password } = useFieldset(formProps.ref);

	return (
		<form {...formProps}>
			<label>
				<div>Email</div>
				<input type="email" name="email" required />
				<div>{email.error}</div>
			</label>
			<label>
				<div>Password</div>
				<input type="password" name="password" required />
				<div>{password.error}</div>
			</label>
			<label>
				<span>Remember me</span>
				<input type="checkbox" name="remember-me" value="yes" />
			</label>
			<button type="submit">Login</button>
		</form>
	);
}
