import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const JsonFile = z
	.instanceof(File)
	.refine((file) => file.name !== '' && file.size !== 0, 'File is required')
	.refine(
		(file) => file.type === 'application/json',
		'Only JSON file is accepted',
	);

const schema = z.object({
	file: z.preprocess(
		(value) => (value === '' ? new File([], '') : value),
		JsonFile,
	),
	files: z
		.preprocess((value) => {
			if (Array.isArray(value)) {
				return value;
			} else if (value instanceof File && value.name !== '' && value.size > 0) {
				return [value];
			} else {
				return [];
			}
		}, z.array(JsonFile).min(1, 'At least 1 file is required'))
		.refine(
			(files) => files.reduce((size, file) => size + file.size, 0) < 5 * 1024,
			'Total file size must be less than 5kb',
		),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	return json(submission);
}

export default function FileUpload() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const state = useActionData();
	const [form, { file, files }] = useForm({
		state,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...form.props} encType="multipart/form-data">
			<Playground title="Employee Form" state={state}>
				<Alert errors={form.errors} />
				<Field label="Single file" config={file}>
					<input {...conform.input(file, { type: 'file' })} />
				</Field>
				<Field label="Multiple files" config={files}>
					<input {...conform.input(files, { type: 'file' })} multiple />
				</Field>
			</Playground>
		</Form>
	);
}
