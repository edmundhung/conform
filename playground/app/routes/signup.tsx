import type { FormState } from '@conform-to/react';
import {
	conform,
	parse,
	useFieldset,
	useForm,
	reportValidity,
} from '@conform-to/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

interface Signup {
	email: string;
	password: string;
	confirmPassword: string;
}

function validate(submission: FormState): FormState {
	const scope = new Set(submission.scope);
	const error = [...submission.error];

	for (const field of scope) {
		switch (field) {
			case 'email': {
				if (submission.value.email === '') {
					error.push([field, 'Email is required']);
				} else if (!`${submission.value.email}`.match(/^[^()@\s]+@[\w\d.]+$/)) {
					error.push([field, 'Email is invalid']);
				}
				break;
			}
			case 'password': {
				if (!scope.has('confirmPassword')) {
					scope.add('confirmPassword');
				}

				if (submission.value.password === '') {
					error.push(['password', 'Password is required']);
				} else if (`${submission.value.password}`.length < 8) {
					error.push(['password', 'Password is too short']);
				}
				break;
			}
			case 'confirmPassword': {
				if (!scope.has('password')) {
					scope.add('password');
				}

				if (submission.value.confirmPassword === '') {
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
			// Never send the password back to the client
		},
		scope: Array.from(scope),
		error,
	};
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData);
	const state = validate(submission);

	return state;
};

export default function SignupForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Signup>({
		...config,
		state,
		validate: config.validate
			? ({ form, submission }) => {
					const result = validate(submission);

					return reportValidity(form, result);
			  }
			: undefined,
		async onSubmit(event, { submission }) {
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
	const { email, password, confirmPassword } = useFieldset(form.ref, {
		...form.config,
		form: 'signup',
	});

	return (
		<Playground title="Signup Form" form="signup" formState={state}>
			<Form id="signup" method="post" {...form.props} />
			<Field label="Email" error={email.error}>
				<input
					{...conform.input(email.config, { type: 'email' })}
					autoComplete="off"
				/>
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
	);
}
