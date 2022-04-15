import type { ActionFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useActionData, useSearchParams } from '@remix-run/react';
import { useMemo, useState } from 'react';
import { styles } from '~/helpers';
import { Form, useFieldset, f, parse } from 'remix-form-validity';

function configureFieldset(password: string) {
	let fieldset = {
		email: f
			.input('email', 'Your email address is invalid')
			.required('Email is required'),
		password: f.input('password').required('Password is required'),
		confirm: f.input('password').required('Confirm password is required'),
	};

	if (password) {
		const escaped = password
			.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
			.replace(/-/g, '\\x2d');

		fieldset.confirm = fieldset.confirm.pattern(new RegExp(escaped));
	}

	return fieldset;
}

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const { value, error } = parse(formData, (value) =>
		configureFieldset(value?.password),
	);

	if (error) {
		return json(error);
	}

	return redirect(`/signup?email=${value.email}&password=${value.password}`);
};

export default function SignupForm() {
	const [searchParams] = useSearchParams();
	const serverError = useActionData();
	const [password, setPassword] = useState('');
	const fieldset = useMemo(() => configureFieldset(password), [password]);
	const [field, error] = useFieldset(fieldset);

	return (
		<>
			{serverError ? (
				<main className="p-8">
					<div className="mb-4 text-pink-500">Signup Error</div>
					{Object.values(serverError).map((error, i) => (
						<div className="text-gray-600" key={i}>{`${error}`}</div>
					))}
				</main>
			) : (
				<main className="p-8">
					{searchParams.has('email') ? (
						<div className="mb-4 text-emerald-500">Signup success</div>
					) : (
						<div className="mb-4">Sign up a new account</div>
					)}
					<div className="text-gray-600">
						Email: {searchParams.get('email') ?? 'n/a'}
					</div>
					<div className="text-gray-600">
						Password: {searchParams.get('password') ?? 'n/a'}
					</div>
				</main>
			)}
			<Form className={styles.form} method="post" noValidate>
				<label className="block">
					<span className={styles.label}>Email</span>
					<input
						className={error.email ? styles.inputWithError : styles.input}
						{...field.email}
					/>
					<p className={styles.errorMessage}>{error.email}</p>
				</label>
				<label className="block">
					<span className={styles.label}>Password</span>
					<input
						className={error.password ? styles.inputWithError : styles.input}
						onBlur={(e) => setPassword(e.currentTarget.value)}
						{...field.password}
					/>
					<p className={styles.errorMessage}>{error.password}</p>
				</label>
				<label className="block">
					<span className={styles.label}>Confirm Password</span>
					<input
						className={error.confirm ? styles.inputWithError : styles.input}
						{...field.confirm}
					/>
					<p className={styles.errorMessage}>{error.confirm}</p>
				</label>
				<button type="submit" className={styles.buttonPrimary}>
					Sign up
				</button>
			</Form>
		</>
	);
}
