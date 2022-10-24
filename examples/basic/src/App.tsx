import { useForm, useFieldset } from '@conform-to/react';

export default function LoginForm() {
	/**
	 * The useForm hook let you take control of the browser
	 * validation flow and customize it
	 */
	const form = useForm({
		onSubmit(event, { formData }) {
			event.preventDefault();

			console.log(Object.fromEntries(formData));
		},
	});
	/**
	 * The useFieldset hook let you subscribe to the state
	 * of each field
	 */
	const { email, password } = useFieldset(form.ref);

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
