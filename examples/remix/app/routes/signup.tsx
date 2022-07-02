import { useForm, useFieldset, f } from '@conform-to/react';
import { createFieldset as resolve, parse } from '@conform-to/zod';
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
	const form = useForm({
		onSubmit(e) {
			e.preventDefault();

			// This time we parse the FormData with zod schema
			const formData = new FormData(e.currentTarget);
			const data = parse(formData, signup);

			console.log('submitted', data);
		},
	});
	const [fieldset, fields] = useFieldset(schema);

	return (
		<>
			<main className="p-8">
				<div className="mb-4">Signup</div>
			</main>
			<form className={styles.form} method="post" {...form}>
				<fieldset {...fieldset}>
					<label className="block">
						<div className={styles.label}>Email</div>
						<input
							className={
								fields.email.error ? styles.inputWithError : styles.input
							}
							{...f.input(fields.email)}
						/>
						<p className={styles.errorMessage}>{fields.email.error}</p>
					</label>
					<label className="block">
						<div className={styles.label}>Password</div>
						<input
							className={
								fields.password.error ? styles.inputWithError : styles.input
							}
							{...f.input(fields.password, { type: 'password' })}
						/>
						<p className={styles.errorMessage}>{fields.password.error}</p>
					</label>
					<label className="block">
						<div className={styles.label}>Confirm Password</div>
						<input
							className={
								fields.confirm.error ? styles.inputWithError : styles.input
							}
							{...f.input(fields.confirm, { type: 'password' })}
						/>
						<p className={styles.errorMessage}>{fields.confirm.error}</p>
					</label>
					<button type="submit" className={styles.buttonPrimary}>
						Sign up
					</button>
				</fieldset>
			</form>
		</>
	);
}
