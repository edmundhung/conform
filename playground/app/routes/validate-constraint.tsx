import {
	type Submission,
	useForm,
	validateConstraint,
} from '@conform-to/react';
import { type LoaderArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { Playground, Field } from '~/components';

interface Schema {
	email: string;
	password: string;
	confirmPassword: string;
}

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		multiplePasswordError:
			url.searchParams.get('multiplePasswordError') === 'yes',
		enableCustomMessage: url.searchParams.get('enableCustomMessage') === 'yes',
	};
}

export default function Example() {
	const [lastSubmission, setLastSubmission] = useState<
		Submission | undefined
	>();
	const { multiplePasswordError, enableCustomMessage } =
		useLoaderData<typeof loader>();
	const [form, { email, password, confirmPassword }] = useForm<Schema>({
		fallbackNative: true,
		onValidate(context) {
			return validateConstraint({
				...context,
				constraint: {
					match(value, { formData, attributeValue }) {
						return value === formData.get(attributeValue);
					},
				},
				acceptMultipleErrors({ name }) {
					return multiplePasswordError && name === 'password';
				},
				formatMessages({ name, defaultErrors }) {
					if (!enableCustomMessage) {
						return defaultErrors;
					}

					return defaultErrors.map((error) => {
						switch (name) {
							case 'email':
								return (
									{
										required: 'Email is required',
										type: 'Email is invalid',
										pattern: 'Email domain is not supported',
									}[error] ?? error
								);
							case 'password':
								return (
									{
										required: 'Password is required',
										minLength: 'Password is too short',
										pattern: 'Password is too weak',
									}[error] ?? error
								);
							case 'confirmPassword':
								return (
									{
										required: 'Confirm password is required',
										match: 'Password does not match',
									}[error] ?? error
								);
							default:
								return error;
						}
					});
				},
			});
		},
		onSubmit(event, { submission }) {
			event.preventDefault();
			setLastSubmission(submission);
		},
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Validate Constraint" lastSubmission={lastSubmission}>
				<fieldset>
					<Field label="Email" config={email}>
						<input
							name="email"
							type="email"
							required
							pattern="[^@]+@example.com"
						/>
					</Field>
					<Field label="Password" config={password}>
						<input
							name="password"
							type="password"
							required
							minLength={5}
							pattern="(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[1-9]).*"
						/>
					</Field>
					<Field label="Confirm Password" config={confirmPassword}>
						<input
							name="confirmPassword"
							type="password"
							required
							data-constraint-match="password"
						/>
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
