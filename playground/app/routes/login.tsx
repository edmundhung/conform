import { type Submission, conform, useForm, parse } from '@conform-to/react';
import { type ActionArgs, type LoaderArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useId } from 'react';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

interface Login {
	email: string;
	password: string;
}

function parseLoginForm(formData: FormData): Submission {
	const submission = parse(formData);

	if (!submission.payload.email) {
		submission.error.push(['email', 'Email is required']);
	}

	if (!submission.payload.password) {
		submission.error.push(['password', 'Password is required']);
	}

	return submission;
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parseLoginForm(formData);

	if (
		submission.error.length === 0 &&
		(submission.payload.email !== 'me@edmund.dev' ||
			submission.payload.password !== '$eCreTP@ssWord')
	) {
		submission.error.push(['', 'The provided email or password is not valid']);
	}

	return json({
		...submission,
		payload: {
			email: submission.payload.email,
			// Never send the password back to the client
		},
	});
};

export default function LoginForm() {
	const formId = useId();
	const config = useLoaderData();
	const state = useActionData();
	const [form, { email, password }] = useForm<Login>({
		...config,
		id: formId,
		state,
		onValidate: config.validate
			? ({ formData }) => parseLoginForm(formData)
			: undefined,
		onSubmit:
			config.mode === 'server-validation'
				? (event, { submission }) => {
						if (submission.intent.startsWith('validate/')) {
							event.preventDefault();
						}
				  }
				: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Login Form" state={state}>
				<Alert message={form.error} />
				<Field label="Email" {...email}>
					<input
						{...conform.input(email.config, { type: 'email' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Password" {...password}>
					<input {...conform.input(password.config, { type: 'password' })} />
				</Field>
			</Playground>
		</Form>
	);
}
