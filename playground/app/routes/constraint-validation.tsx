import { parse, getFormElements } from '@conform-to/dom';
import { conform, useForm, type Submission } from '@conform-to/react';
import { Form } from '@remix-run/react';
import { useState } from 'react';
import { Playground, Field } from '~/components';

interface Schema {
	email: string;
	password: string;
	confirmPassword: string;
}

function getErrorMessages(validity: ValidityState) {
	const error: Array<string> = [];

	if (validity.valueMissing) {
		error.push('required');
	}

	if (validity.typeMismatch || validity.badInput) {
		error.push('type');
	}

	if (validity.tooShort) {
		error.push('minLength');
	}

	if (validity.rangeUnderflow) {
		error.push('min');
	}

	if (validity.stepMismatch) {
		error.push('step');
	}

	if (validity.tooLong) {
		error.push('maxLength');
	}

	if (validity.rangeOverflow) {
		error.push('max');
	}

	if (validity.patternMismatch) {
		error.push('pattern');
	}

	return error;
}

function validateConstraint(
	{ form, formData }: { form: HTMLFormElement; formData: FormData },
	constraints?: Record<
		Lowercase<string>,
		(
			value: string,
			context: { formData: FormData; attributeValue: string },
		) => boolean
	>,
) {
	const submission = parse(formData);

	for (const field of getFormElements(form)) {
		const errors = getErrorMessages(field.validity);

		if (errors.length === 0 && constraints) {
			for (const [name, validate] of Object.entries(constraints)) {
				const key = `constraint${name.slice(0, 1).toUpperCase()}${name
					.slice(1)
					.toLowerCase()}`;
				const attributeValue = field.dataset[key];

				if (
					typeof attributeValue !== 'undefined' &&
					!validate(field.value, { formData, attributeValue })
				) {
					errors.push(name);
					break;
				}
			}
		}

		if (errors.length > 0) {
			submission.error.push([field.name, errors[0]]);
		}
	}

	return submission;
}

export default function Example() {
	const [state, setState] = useState<Submission<Schema> | undefined>();
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
			return validateConstraint(context, {
				match(value, context) {
					return value === context.formData.get(context.attributeValue);
				},
			});
		},
		onSubmit(event, { submission }) {
			event.preventDefault();
			setState(submission);
		},
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
