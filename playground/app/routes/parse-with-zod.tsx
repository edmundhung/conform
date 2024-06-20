import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
	json,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';
import { z } from 'zod';

const schema = z.object({
	username: z.string().min(3, 'Username is too short'),
	profile: z.preprocess(
		(json) => {
			if (typeof json === 'string' && json !== '') {
				return JSON.parse(json);
			}

			return;
		},
		z.object({
			age: z.number().int().positive(),
		}),
	),
});

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, {
		schema,
	});

	if (submission.status === 'success') {
		// eslint-disable-next-line no-console
		console.log(submission.value);
	}

	return json(submission.reply());
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		defaultValue: {
			username: 'test',
			profile: JSON.stringify({
				age: 35,
			}),
		},
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Parse with zod" result={lastResult}>
				<Field label="Username" meta={fields.username}>
					<input {...getInputProps(fields.username, { type: 'text' })} />
				</Field>
				<Field label="Profile" meta={fields.profile}>
					<input {...getInputProps(fields.profile, { type: 'text' })} />
				</Field>
			</Playground>
		</Form>
	);
}
