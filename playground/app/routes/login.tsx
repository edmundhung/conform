import {
	type Submission,
	type SubmissionStatus,
	conform,
	useFieldset,
	useForm,
	parse,
	reportValidity,
} from '@conform-to/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

interface Login {
	email: string;
	password: string;
}

function validate(submission: Submission<Login>): SubmissionStatus<Login> {
	if (submission.scope.includes('email') && submission.value.email === '') {
		submission.error.push(['email', 'Email is required']);
	}

	if (
		submission.scope.includes('password') &&
		submission.value.password === ''
	) {
		submission.error.push(['password', 'Password is required']);
	}

	return submission;
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse<Login>(formData);
	const status = validate(submission);

	if (
		status.error.length === 0 &&
		(status.value.email !== 'me@edmund.dev' ||
			status.value.password !== '$eCreTP@ssWord')
	) {
		status.error.push(['', 'The provided email or password is not valid']);
	}

	return {
		...status,
		value: {
			email: status.value.email,
			// Never send the password back to the client
		},
	};
};

export default function LoginForm() {
	const config = useLoaderData();
	const status = useActionData();
	const form = useForm<Login>({
		...config,
		status,
		onValidate: config.validate
			? ({ form, submission }) => {
					const status = validate(submission);

					return reportValidity(form, status);
			  }
			: undefined,
		onSubmit(event, { submission }) {
			switch (submission.type) {
				case 'validate': {
					event.preventDefault();
					break;
				}
			}
		},
	});
	const { email, password } = useFieldset(form.ref, form.config);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Login Form" status={status}>
				<Alert message={form.error} />
				<Field label="Email" error={email.error}>
					<input
						{...conform.input(email.config, { type: 'email' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Password" error={password.error}>
					<input {...conform.input(password.config, { type: 'password' })} />
				</Field>
			</Playground>
		</Form>
	);
}
