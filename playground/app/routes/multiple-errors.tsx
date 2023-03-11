import { conform, parse, useForm } from '@conform-to/react';
import { parse as parseWithZod } from '@conform-to/zod';
import { parse as parseWithYup } from '@conform-to/yup';
import { type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';
import { z } from 'zod';
import * as yup from 'yup';

interface Schema {
	username: string;
}

function parseForm(formData: FormData, validator: string | null) {
	switch (validator) {
		case 'yup': {
			return parseWithYup(formData, {
				schema: yup.object({
					username: yup
						.string()
						.required('Username is required')
						.test(
							'test-minlength',
							'Min. 5 characters',
							(username) => !username || username.length > 5,
						)
						.test(
							'test-lowercase',
							'At least 1 lowercase character',
							(username) => !username || username.toUpperCase() !== username,
						)
						.test(
							'test-uppercase',
							'At least 1 uppercase character',
							(username) => !username || username.toLowerCase() !== username,
						)
						.test(
							'test-number',
							'At least 1 number',
							(username) => !username || username.match(/[0-9]/) !== null,
						),
				}),
				acceptMultipleErrors({ name }) {
					return name === 'username';
				},
			});
		}
		case 'zod': {
			return parseWithZod(formData, {
				schema: z.object({
					username: z
						.string()
						.min(1, 'Username is required')
						.refine(
							(username) => !username || username.length > 5,
							'Min. 5 characters',
						)
						.refine(
							(username) => !username || username.toUpperCase() !== username,
							'At least 1 lowercase character',
						)
						.refine(
							(username) => !username || username.toLowerCase() !== username,
							'At least 1 uppercase character',
						)
						.refine(
							(username) => !username || username.match(/[0-9]/),
							'At least 1 number',
						),
				}),
				acceptMultipleErrors({ name }) {
					return name === 'username';
				},
			});
		}
		default: {
			return parse(formData, {
				resolve({ username }) {
					const errors: string[] = [];

					if (typeof username !== 'string' || username === '') {
						errors.push('Username is required');
					} else {
						if (username.length < 5) {
							errors.push('Min. 5 characters');
						}

						if (username.toUpperCase() === username) {
							errors.push('At least 1 lowercase character');
						}

						if (username.toLowerCase() === username) {
							errors.push('At least 1 uppercase character');
						}

						if (!username.match(/[0-9]/)) {
							errors.push('At least 1 number');
						}
					}

					if (errors.length > 0) {
						return {
							error: {
								username: errors,
							},
						};
					}

					return {
						value: {
							username,
						},
					};
				},
			});
		}
	}
}

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
		validator: url.searchParams.get('validator'),
	};
}

export async function action({ request }: ActionArgs) {
	const url = new URL(request.url);
	const formData = await request.formData();
	const submission = parseForm(formData, url.searchParams.get('validator'));

	return json(submission);
}

export default function Example() {
	const { validator, noClientValidate } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, { username }] = useForm<Schema>({
		lastSubmission,
		onValidate: !noClientValidate
			? ({ formData }) => parseForm(formData, validator)
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Mutliple Errors" lastSubmission={lastSubmission}>
				<Field label="Username" config={username}>
					<input {...conform.input(username, { type: 'text' })} />
				</Field>
			</Playground>
		</Form>
	);
}
