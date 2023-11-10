import { ConformBoundary, conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const JsonFile = z
	.instanceof(File, { message: 'File is required' })
	.refine(
		(file) => file.type === 'application/json',
		'Only JSON file is accepted',
	);

const schema = z.object({
	file: JsonFile,
	files: z
		.array(JsonFile)
		.min(1, 'At least 1 file is required')
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

	if (!submission.value) {
		return json(submission.reject());
	}

	return json(submission.accept());
}

export default function FileUpload() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const form = useForm({
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<ConformBoundary context={form.context}>
			<Form method="post" {...conform.form(form)} encType="multipart/form-data">
				<Playground title="Employee Form" lastSubmission={lastResult}>
					<Alert errors={form.error} />
					<Field label="Single file" config={form.fields.file}>
						<input {...conform.input(form.fields.file, { type: 'file' })} />
					</Field>
					<Field label="Multiple files" config={form.fields.files}>
						<input
							{...conform.input(form.fields.files, { type: 'file' })}
							multiple
						/>
					</Field>
				</Playground>
			</Form>
		</ConformBoundary>
	);
}
