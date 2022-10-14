import type { FormState } from '@conform-to/react';
import {
	conform,
	parse,
	useFieldset,
	useForm,
	hasError,
	setFormError,
	serverValidation,
} from '@conform-to/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

interface Signup {
	email: string;
	username: string;
	password: string;
	confirmPassword: string;
}

function validate(submission: FormState): FormState {
	const scope = new Set(submission.scope);
	const error = [...submission.error];

	for (const field of scope) {
		switch (field) {
			case 'email': {
				if (typeof submission.value.email !== 'string') {
					error.push([field, 'Email is required']);
				}
				break;
			}
			case 'username': {
				if (typeof submission.value.username !== 'string') {
					error.push([field, 'Username is required']);
				} else if (submission.value.username.length < 6) {
					error.push([field, 'Username is too short']);
				}
				break;
			}
			case 'password':
			case 'confirmPassword': {
				if (!scope.has('confirmPassword')) {
					scope.add('confirmPassword');
				} else if (!scope.has('password')) {
					scope.add('password');
				}

				if (typeof submission.value.password !== 'string') {
					error.push(['password', 'Password is required']);
				} else if (submission.value.password.length < 8) {
					error.push(['password', 'Password is too short']);
				}

				if (typeof submission.value.confirmPassword !== 'string') {
					error.push(['confirmPassword', 'Confirm password is required']);
				} else if (
					submission.value.confirmPassword !== submission.value.password
				) {
					error.push([
						'confirmPassword',
						'The password provided does not match',
					]);
				}
				break;
			}
		}
	}

	return {
		...submission,
		value: {
			email: submission.value.email,
			username: submission.value.username,
			// Never send the password back to the client
		},
		scope: Array.from(scope),
		error,
	};
}

async function isUnqiue(username: unknown): Promise<boolean> {
	return new Promise((resolve) =>
		setTimeout(() => {
			resolve(username === 'edmundhung');
		}, Math.random() * 250),
	); // 100ms - 1s
}

async function signup(): Promise<void> {
	return new Promise((resolve, reject) =>
		setTimeout(() => {
			if (Math.random() > 0.75) {
				resolve();
			} else {
				reject();
			}
		}, 500),
	); // 100ms - 1s
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData);
	const state = validate(submission);

	if (
		state.scope.includes('username') &&
		!hasError(state.error, 'username') &&
		!(await isUnqiue(state.value.username))
	) {
		state.error.push(['username', 'Username is already taken']);
	}

	switch (submission.type) {
		case 'validate':
			return state;
		default:
			if (state.error.length > 0) {
				return state;
			}

			try {
				await signup();

				return redirect('/');
			} catch (e) {
				return {
					...state,
					error: state.error.concat([
						['', 'Signup fail. Please try again later.'],
					]),
				};
			}
	}
};

export default function SignupForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Signup>({
		...config,
		state,
		validate({ form, submission }) {
			const state = validate(submission);

			if (
				state.scope.includes('username') &&
				!hasError(state.error, 'username')
			) {
				throw serverValidation();
			}

			setFormError(form, state.error, state.scope);
		},
		onSubmit(event, { submission }) {
			switch (submission.type) {
				case 'validate': {
					if (submission.data !== 'username') {
						event.preventDefault();
					}
					break;
				}
			}
		},
	});
	const { email, username, password, confirmPassword } = useFieldset(
		form.ref,
		form.config,
	);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Signup Form" formState={state}>
				<Alert message={form.error} />
				<Field label="Email" error={email.error}>
					<input
						{...conform.input(email.config, { type: 'email' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Username" error={username.error}>
					<input {...conform.input(username.config, { type: 'text' })} />
				</Field>
				<Field label="Password" error={password.error}>
					<input {...conform.input(password.config, { type: 'password' })} />
				</Field>
				<Field label="Confirm password" error={confirmPassword.error}>
					<input
						{...conform.input(confirmPassword.config, { type: 'password' })}
					/>
				</Field>
			</Playground>
		</Form>
	);
}
