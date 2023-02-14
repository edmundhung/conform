import { validateConstraint } from '@conform-to/dom';
import { conform, useForm, type Submission } from '@conform-to/react';
import { Form } from '@remix-run/react';
import { useState } from 'react';
import { Playground, Field } from '~/components';

interface Schema {
	email: string;
	password: string;
	confirmPassword: string;
}

export default function Example() {
	const [state, setState] = useState<Submission | undefined>();
	const [form, { email, password, confirmPassword }] = useForm<Schema>({
		constraint: {
			email: {
				required: true,
				pattern: '[^@]+@[^@]+\\.[^@]+',
			},
			password: {
				required: true,
			},
			confirmPassword: {
				required: true,
			},
		},
		onValidate(context) {
			return validateConstraint({
				...context,
				constraints: {
					match(value, context) {
						return value === context.formData.get(context.attributeValue);
					},
				},
				shouldValidate({ intent, name, defaultShouldValidate }) {
					if (intent === 'validate/password' && name === 'confirmPassword') {
						return true;
					}

					return defaultShouldValidate;
				},
			});
		},
		onSubmit(event, { submission }) {
			event.preventDefault();
			setState(submission);
		},
		noValidate: true,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Validate Constraint" state={state}>
				<fieldset>
					<Field label="Email" {...email}>
						<input {...conform.input(email.config, { type: 'email' })} />
					</Field>
					<Field label="Password" {...password}>
						<input {...conform.input(password.config, { type: 'password' })} />
					</Field>
					<Field label="Confirm Password" {...confirmPassword}>
						<input
							{...conform.input(confirmPassword.config, { type: 'password' })}
							data-constraint-match={password.config.name}
						/>
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
