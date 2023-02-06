import { conform, parse, useForm } from '@conform-to/react';
import { type ActionArgs, type LoaderArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

interface Signup {
	email: string;
	password: string;
	confirmPassword: string;
}

function parseSignupForm(formData: FormData) {
	const submission = parse(formData);
	const { email, password, confirmPassword } = submission.payload;

	if (!email) {
		submission.error.push(['email', 'Email is required']);
	} else if (
		typeof email !== 'string' ||
		!email.match(/^[^()@\s]+@[\w\d.]+$/)
	) {
		submission.error.push(['email', 'Email is invalid']);
	}

	if (!password) {
		submission.error.push(['password', 'Password is required']);
	} else if (typeof password === 'string' && password.length < 8) {
		submission.error.push(['password', 'Password is too short']);
	}

	if (!confirmPassword) {
		submission.error.push(['confirmPassword', 'Confirm password is required']);
	} else if (confirmPassword !== password) {
		submission.error.push([
			'confirmPassword',
			'The password provided does not match',
		]);
	}

	return submission;
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parseSignupForm(formData);

	return json({
		...submission,
		payload: {
			email: submission.payload.email,
			// Never send the password back to the client
		},
	});
};

export default function SignupForm() {
	const config = useLoaderData();
	const state = useActionData();
	const [form, { email, password, confirmPassword }] = useForm<Signup>({
		...config,
		id: 'signup',
		state,
		onValidate: config.validate
			? ({ formData }) => parseSignupForm(formData)
			: undefined,
	});

	return (
		<Playground title="Signup Form" form={form.id} state={state}>
			<Form method="post" {...form.props} />
			<Field label="Email" {...email}>
				<input
					{...conform.input(email.config, { type: 'email' })}
					autoComplete="off"
					form="signup"
				/>
			</Field>
			<Field label="Password" {...password}>
				<input {...conform.input(password.config, { type: 'password' })} />
			</Field>
			<Field label="Confirm password" {...confirmPassword}>
				<input
					{...conform.input(confirmPassword.config, { type: 'password' })}
					form="signup"
				/>
			</Field>
		</Playground>
	);
}
