import type { Submission } from '@conform-to/react';
import { conform, parse, useFieldset, useForm } from '@conform-to/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

interface Signup {
	email: string;
	password: string;
	confirmPassword: string;
}

function validate(submission: Submission<Signup>): Submission<Signup> {
	const error = [...submission.error];
	const { email, password, confirmPassword } = submission.value;

	if (!email) {
		error.push(['email', 'Email is required']);
	} else if (!email.match(/^[^()@\s]+@[\w\d.]+$/)) {
		error.push(['email', 'Email is invalid']);
	}

	if (!password) {
		error.push(['password', 'Password is required']);
	} else if (password.length < 8) {
		error.push(['password', 'Password is too short']);
	}

	if (!confirmPassword) {
		error.push(['confirmPassword', 'Confirm password is required']);
	} else if (confirmPassword !== password) {
		error.push(['confirmPassword', 'The password provided does not match']);
	}

	return {
		value: {
			email,
			// Never send the password back to the client
		},
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
		onValidate: config.validate
			? ({ submission }) => {
					const state = validate(submission);

					return state.error;
			  }
			: undefined,
		onSubmit:
			config.mode === 'server-validation'
				? (event, { submission }) => {
						if (submission.type === 'validate') {
							event.preventDefault();
						}
				  }
				: undefined,
	});
	const { email, password, confirmPassword } = useFieldset(form.ref, {
		...form.config,
		form: 'signup',
	});

	return (
		<Playground title="Signup Form" form="signup" state={state}>
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
