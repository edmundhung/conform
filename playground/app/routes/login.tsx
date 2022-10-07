import {
	conform,
	type FormState,
	parse,
	useFieldset,
	useForm,
	setFormError,
} from '@conform-to/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

interface Login {
	email: string;
	password: string;
}

function validate(state: FormState): FormState {
	if (typeof state.value.email !== 'string') {
		state.error.push(['email', 'Email is required']);
	}

	if (typeof state.value.password !== 'string') {
		state.error.push(['password', 'Password is required']);
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
	const state = validate(parse(formData));

	if (
		state.error.length === 0 &&
		(state.value.email !== 'me@edmund.dev' ||
			state.value.password !== '$eCreTP@ssWord')
	) {
		state.error.push(['_', 'The provided email or password is not valid']);
	}

	return state;
};

export default function LoginForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Login>({
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
	const { email, password } = useFieldset(form.props.ref, form.config);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Login Form" formState={state}>
				<fieldset>
					<Field label="Email" error={email.error}>
						<input
							{...conform.input(email.config, { type: 'email' })}
							autoComplete="off"
						/>
					</Field>
					<Field label="Password" error={password.error}>
						<input {...conform.input(password.config, { type: 'password' })} />
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
