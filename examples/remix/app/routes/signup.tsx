import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { styles } from '~/helpers';
import { useForm, useFieldset, f } from '@conform-to/react';
import { createFieldset, parse } from '@conform-to/zod';
import z from 'zod';

const schema = z
	.object({
		email: z
			.string({ required_error: 'Email is required' })
			.email('Your email address is invalid'),
		password: z.string({ required_error: 'Password is required' }),
		confirm: z.string({ required_error: 'Confirm password is required' }),
	})
	.refine((value) => value.password === value.confirm, {
		message: 'The password do not match',
		path: ['confirm'],
	});

const fieldset = createFieldset(schema);

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const formState = parse(formData, schema);

	return json(formState);
};

export default function SignupForm() {
	const formState = useActionData() ?? {};
	const formProps = useForm({ initialReport: 'onBlur' });
	const [setup, error] = useFieldset(fieldset);

	return (
		<>
			{formState.error ? (
				<main className="p-8">
					<div className="mb-4 text-pink-500">Signup Error</div>
					{Object.values(formState.error).map((error, i) => (
						<div className="text-gray-600" key={i}>{`${error}`}</div>
					))}
				</main>
			) : (
				<main className="p-8">
					<div className="mb-4">Signup</div>
				</main>
			)}
			<Form className={styles.form} method="post" {...formProps}>
				<fieldset {...setup.fieldset}>
					<label className="block">
						<div className={styles.label}>Email</div>
						<input
							className={error.email ? styles.inputWithError : styles.input}
							{...f.input(setup.field.email)}
						/>
						<p className={styles.errorMessage}>{error.email}</p>
					</label>
					<label className="block">
						<div className={styles.label}>Password</div>
						<input
							className={error.password ? styles.inputWithError : styles.input}
							{...f.input(setup.field.password, { type: 'password' })}
						/>
						<p className={styles.errorMessage}>{error.password}</p>
					</label>
					<label className="block">
						<div className={styles.label}>Confirm Password</div>
						<input
							className={error.confirm ? styles.inputWithError : styles.input}
							{...f.input(setup.field.confirm, { type: 'password' })}
						/>
						<p className={styles.errorMessage}>{error.confirm}</p>
					</label>
					<button type="submit" className={styles.buttonPrimary}>
						Sign up
					</button>
				</fieldset>
			</Form>
		</>
	);
}
