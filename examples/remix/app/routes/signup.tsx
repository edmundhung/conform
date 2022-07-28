import { type Submission, useFieldset, conform } from '@conform-to/react';
import { resolve, parse } from '@conform-to/zod';
import { useState } from 'react';
import { z } from 'zod';
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
		remember: z.preprocess((value) => value === 'yes', z.boolean().optional()),
	})
	.refine((value) => value.password === value.confirm, {
		message: 'The password do not match',
		path: ['confirm'],
	});

export default function SignupForm() {
	const [submission, setSubmission] = useState<Submission<
		z.infer<typeof signup>
	> | null>(null);
	const [fieldsetProps, { email, password, confirm, remember }] = useFieldset(
		resolve(signup),
		{
			defaultValue: submission?.form.value,
			error: submission?.form.error,
		},
	);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();

				const formData = new FormData(event.currentTarget);
				const submission = parse(formData, signup);

				setSubmission(submission);
			}}
		>
			<header className={styles.header}>
				<h1>Signup Form</h1>
				{submission?.state === 'accepted' ? (
					<pre className={styles.result}>
						{JSON.stringify(submission?.data, null, 2)}
					</pre>
				) : null}
			</header>
			<fieldset className={styles.card} {...fieldsetProps}>
				<label className={styles.block}>
					<div className={styles.label}>Email</div>
					<input
						className={email.error ? styles.invalidInput : styles.input}
						{...conform.input(email)}
					/>
					<p className={styles.errorMessage}>{email.error}</p>
				</label>
				<label className={styles.block}>
					<div className={styles.label}>Password</div>
					<input
						className={password.error ? styles.invalidInput : styles.input}
						{...conform.input(password, { type: 'password' })}
					/>
					<p className={styles.errorMessage}>{password.error}</p>
				</label>
				<label className={styles.block}>
					<div className={styles.label}>Confirm Password</div>
					<input
						className={confirm.error ? styles.invalidInput : styles.input}
						{...conform.input(confirm, { type: 'password' })}
					/>
					<p className={styles.errorMessage}>{confirm.error}</p>
				</label>
				<label className={styles.optionLabel}>
					<input
						className={styles.optionInput}
						{...conform.input(remember, {
							type: 'checkbox',
							value: 'yes',
						})}
					/>
					<span
						className={remember.error ? styles.invalidOption : styles.option}
					>
						Remember me
					</span>
				</label>
				<button type="submit" className={styles.buttonPrimary}>
					Sign up
				</button>
			</fieldset>
		</form>
	);
}
