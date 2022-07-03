import { useForm, useFieldset, conform } from '@conform-to/react';
import { resolve, parse } from '@conform-to/zod';
import z from 'zod';
import { styles } from '~/helpers';

const signup = z
	.object({
		email: z
			.string({ required_error: 'Email is required' })
			.email('Your email address is invalid'),
		password: z
			.string({ required_error: 'Password is required' })
			.min(8, 'The minimum password length is 8 characters'),
		confirm: z.string({ required_error: 'Confirm password is required' }),
	})
	.refine((value) => value.password === value.confirm, {
		message: 'The password do not match',
		path: ['confirm'],
	});

const schema = resolve(signup);

export default function SignupForm() {
	const formProps = useForm({
		onSubmit(e) {
			e.preventDefault();

			// This time we parse the FormData with zod schema
			const formData = new FormData(e.currentTarget);
			const data = parse(formData, signup);

			console.log('submitted', data);
		},
	});
	const [fieldsetProps, { email, password, confirm }] = useFieldset(schema);

	return (
		<form className={styles.form} method="post" {...formProps}>
			<main className="p-8">
				<div className="mb-4">Signup</div>
			</main>
			<fieldset {...fieldsetProps}>
				<label className="block">
					<div className={styles.label}>Email</div>
					<input
						className={email.error ? styles.invalidInput : styles.input}
						{...conform.input(email)}
					/>
					<p className={styles.errorMessage}>{password.error}</p>
				</label>
				<label className="block">
					<div className={styles.label}>Password</div>
					<input
						className={password.error ? styles.invalidInput : styles.input}
						{...conform.input(password, { type: 'password' })}
					/>
					<p className={styles.errorMessage}>{password.error}</p>
				</label>
				<label className="block">
					<div className={styles.label}>Confirm Password</div>
					<input
						className={confirm.error ? styles.invalidInput : styles.input}
						{...conform.input(confirm, { type: 'password' })}
					/>
					<p className={styles.errorMessage}>{confirm.error}</p>
				</label>
				<button type="submit" className={styles.buttonPrimary}>
					Sign up
				</button>
			</fieldset>
		</form>
	);
}
