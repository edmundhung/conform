import { useForm, useFieldset, conform } from '@conform-to/react';
import { resolve, parse } from '@conform-to/zod';
import { type ActionFunction } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
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

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const data = parse(formData, signup);

	return data;
};

export default function SignupForm() {
	const formResult = useActionData();
	const formProps = useForm();
	const [fieldsetProps, { email, password, confirm }] = useFieldset(schema, {
		error: formResult?.error,
	});

	return (
		<Form method="post" {...formProps}>
			<header className={styles.header}>
				<h1>Signup Form</h1>
				{formResult?.state === 'accepted' ? (
					<pre className={styles.result}>
						{JSON.stringify(formResult?.value, null, 2)}
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
				<button type="submit" className={styles.buttonPrimary}>
					Sign up
				</button>
			</fieldset>
		</Form>
	);
}
