import { useForm, useFieldset } from '@conform-to/react';

export default function LoginForm() {
	const form = useForm({
		initialReport: 'onBlur',
		onSubmit(event, { submission }) {
			event.preventDefault();

			console.log(submission);
		},
	});
	const { email, password } = useFieldset(form.ref);

	return (
		<form {...form.props}>
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
				<div>
					<span>Remember me</span>
					<input type="checkbox" name="remember-me" value="yes" />
				</div>
			</label>
			<button type="submit">Login</button>
		</form>
	);
}
