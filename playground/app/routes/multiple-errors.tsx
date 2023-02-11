import { conform, parse, useForm } from '@conform-to/react';
import { type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';

interface Schema {
	username: string;
}

function parseForm(formData: FormData) {
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

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseForm(formData);

	return json(submission);
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const state = useActionData<typeof action>();
	const [form, { username }] = useForm<Schema>({
		state,
		onValidate: !noClientValidate
			? ({ formData }) => parseForm(formData)
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Mutliple Errors" state={state}>
				<Field label="Username" {...username}>
					<input {...conform.input(username.config, { type: 'text' })} />
				</Field>
			</Playground>
		</Form>
	);
}
