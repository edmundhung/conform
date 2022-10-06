import type { FormState } from '@conform-to/react';
import {
	conform,
	parse,
	useFieldset,
	useForm,
	setFormError,
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

function validate(state: FormState): FormState {
	if (typeof state.value.email !== 'string') {
		state.error.push(['email', 'Email is required']);
	}

	if (typeof state.value.password !== 'string') {
		state.error.push(['password', 'Password is required']);
	} else if (state.value.password.length < 8) {
		state.error.push(['password', 'Password is too short']);
	}

	if (typeof state.value.confirmPassword !== 'string') {
		state.error.push(['confirmPassword', 'Confirm password is required']);
	} else if (state.value.confirmPassword !== state.value.password) {
		state.error.push([
			'confirmPassword',
			'The password provided does not match',
		]);
	}

	return {
		...state,
		value: {
			email: state.value.email,
			// Never send the password back to the client
		},
	};
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const state = parse(formData);

	return validate(state);
};

export default function LoginForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Signup>({
		...config,
		state,
		validate: config.validate
			? (formData, form) => {
					const state = parse(formData);
					const result = validate(state);

					setFormError(form, result.error);
			  }
			: undefined,
	});
	const { email, password, confirmPassword } = useFieldset(form.props.ref, {
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
