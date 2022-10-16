import type { Submission, SubmissionStatus } from '@conform-to/react';
import {
	conform,
	parse,
	useFieldset,
	useForm,
	reportValidity,
} from '@conform-to/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

interface Signup {
	email: string;
	password: string;
	confirmPassword: string;
}

function validate(submission: Submission<Signup>): SubmissionStatus<Signup> {
	const scope = new Set(submission.scope);
	const error = [...submission.error];
	const { email, password, confirmPassword } = submission.value;

	for (const field of scope) {
		switch (field) {
			case 'email': {
				if (typeof email === 'undefined' || email === '') {
					error.push([field, 'Email is required']);
				} else if (!email.match(/^[^()@\s]+@[\w\d.]+$/)) {
					error.push([field, 'Email is invalid']);
				}
				break;
			}
			case 'password': {
				if (!scope.has('confirmPassword')) {
					scope.add('confirmPassword');
				}

				if (typeof password === 'undefined' || password === '') {
					error.push(['password', 'Password is required']);
				} else if (`${password}`.length < 8) {
					error.push(['password', 'Password is too short']);
				}
				break;
			}
			case 'confirmPassword': {
				if (!scope.has('password')) {
					scope.add('password');
				}

				if (typeof confirmPassword === 'undefined' || confirmPassword === '') {
					error.push(['confirmPassword', 'Confirm password is required']);
				} else if (confirmPassword !== password) {
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
		value: {
			email,
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
	const status = validate(submission);

	return status;
};

export default function SignupForm() {
	const config = useLoaderData();
	const status = useActionData();
	const form = useForm<Signup>({
		...config,
		status,
		onValidate: config.validate
			? ({ form, submission }) => {
					const status = validate(submission);

					return reportValidity(form, status);
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
		<Playground title="Signup Form" form="signup" status={status}>
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
