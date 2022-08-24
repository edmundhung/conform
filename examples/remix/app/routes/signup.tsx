import {
	type Submission,
	type InferSchema,
	useForm,
	useFieldset,
	conform,
} from '@conform-to/react';
import { resolve } from '@conform-to/zod';
import { useState } from 'react';
import { z } from 'zod';
import { styles } from '~/helpers';

const signup = resolve(
	z
		.object({
			email: z
				.string({ required_error: 'Email is required' })
				.email('Your email address is invalid'),
			password: z
				.string({ required_error: 'Password is required' })
				.min(8, 'The minimum password length is 8 characters'),
			confirm: z.string({ required_error: 'Confirm password is required' }),
			remember: z.preprocess(
				(value) => value === 'yes',
				z.boolean().optional(),
			),
		})
		.refine((value) => value.password === value.confirm, {
			message: 'The password do not match',
			path: ['confirm'],
		}),
);

export default function SignupForm() {
	const [submission, setSubmission] = useState<Submission<
		z.infer<typeof signup.source>
	> | null>(null);
	const formProps = useForm({
		validate: signup.validate,
		onSubmit(event) {
			event.preventDefault();

			const formData = new FormData(event.currentTarget);
			const submission = signup.parse(formData);

			setSubmission(submission);
		},
	});
	const { email, password, confirm, remember } = useFieldset(formProps.ref, {
		constraint: signup.constraint,
		defaultValue: submission?.form.value,
		initialError: submission?.form.error.details,
	});

	return (
		<form {...formProps}>
			<header className={styles.header}>
				<h1>Signup Form</h1>
				{submission?.state === 'accepted' ? (
					<pre className={styles.result}>
						{JSON.stringify(submission?.data, null, 2)}
					</pre>
				) : null}
			</header>
			<fieldset className={styles.card}>
				<label className={styles.block}>
					<div className={styles.label}>Email</div>
					<input
						className={email.error ? styles.invalidInput : styles.input}
						{...conform.input(email.config)}
					/>
					<p className={styles.errorMessage}>{email.error}</p>
				</label>
				<label className={styles.block}>
					<div className={styles.label}>Password</div>
					<input
						className={password.error ? styles.invalidInput : styles.input}
						{...conform.input(password.config, { type: 'password' })}
					/>
					<p className={styles.errorMessage}>{password.error}</p>
				</label>
				<label className={styles.block}>
					<div className={styles.label}>Confirm Password</div>
					<input
						className={confirm.error ? styles.invalidInput : styles.input}
						{...conform.input(confirm.config, { type: 'password' })}
					/>
					<p className={styles.errorMessage}>{confirm.error}</p>
				</label>
				<label className={styles.optionLabel}>
					<input
						className={styles.optionInput}
						{...conform.input(remember.config, {
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
