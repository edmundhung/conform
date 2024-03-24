import {
	getCollectionProps,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('a'),
		message: z.string(),
	}),
	z.object({
		type: z.literal('b'),
		title: z.string(),
	}),
]);

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
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
			title: 'Test',
			message: 'Hello',
		},
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	console.log({
		value: form.value,
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Template Form" result={{ value: form.value }}>
				<Field label="Type" meta={fields.type}>
					{getCollectionProps(fields.type, {
						type: 'radio',
						options: ['a', 'b'],
					}).map((props) => (
						<label key={props.key}>
							<input {...props} />
							{props.value}
						</label>
					))}
				</Field>
				{fields.type.value === 'a' ? (
					<Field key="a" label="Message" meta={fields.message}>
						<input {...getInputProps(fields.message, { type: 'text' })} />
					</Field>
				) : fields.type.value === 'b' ? (
					<Field key="b" label="Title" meta={fields.title}>
						<input {...getInputProps(fields.title, { type: 'text' })} />
					</Field>
				) : null}
			</Playground>
		</Form>
	);
}
