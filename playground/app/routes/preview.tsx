import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { useState } from 'react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	title: z.string(),
	year: z.number().int().min(2000).max(2030),
	published: z.boolean().default(false),
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json(submission.reply());
}

export default function Example() {
	const lastResult = useActionData<typeof action>();

	const defaultValue = {
		title: 'message',
		year: 2025,
		published: true,
	};

	const [preview, setPreview] = useState(defaultValue);

	const [form, fields] = useForm({
		lastResult,
		defaultValue,
		onValidate: ({ formData }) => {
			const submission = parseWithZod(formData, { schema });

			if (submission.value) {
				setPreview(submission.value);
			}

			return submission;
		},
		shouldValidate: 'onInput',
		shouldRevalidate: 'onInput',
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Observe Preview Value" result={{ value: preview }}>
				<Field key="title" label="Title" meta={fields.title}>
					<input {...getInputProps(fields.title, { type: 'text' })} />
				</Field>
				<Field key="year" label="Year" meta={fields.year}>
					<input {...getInputProps(fields.year, { type: 'number' })} />
				</Field>
				<Field key="published" label="Published" meta={fields.published}>
					<input {...getInputProps(fields.published, { type: 'checkbox' })} />
				</Field>
			</Playground>
		</Form>
	);
}
