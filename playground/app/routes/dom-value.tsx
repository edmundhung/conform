import {
	getCollectionProps,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('message'),
		message: z.string(),
	}),
	z.object({
		type: z.literal('title'),
		title: z.string(),
	}),
]);

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json(submission.reply());
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		defaultValue: {
			type: 'message',
			message: 'Hello',
		},
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Observe DOM Value" result={{ value: form.value }}>
				<Field label="Type" meta={fields.type}>
					{getCollectionProps(fields.type, {
						type: 'radio',
						options: ['title', 'message'],
					}).map((props) => (
						<label key={props.key}>
							<input {...props} />
							{props.value}
						</label>
					))}
				</Field>
				{fields.type.value === 'message' ? (
					<Field key="message" label="Message" meta={fields.message}>
						<input {...getInputProps(fields.message, { type: 'text' })} />
					</Field>
				) : fields.type.value === 'title' ? (
					<Field key="title" label="Title" meta={fields.title}>
						<input {...getInputProps(fields.title, { type: 'text' })} />
					</Field>
				) : null}
			</Playground>
		</Form>
	);
}
