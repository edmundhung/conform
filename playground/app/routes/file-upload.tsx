import { conform, parse, useFieldset, useForm } from '@conform-to/react';
import { formatError, validate } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

function isEmptyFile(file: unknown): boolean {
	return (
		// FIXME: The empty file is presented as empty string on server side
		// This is caused by @remix-run/web-fetch considered empty filename as non-file entry
		file === '' ||
		(file instanceof File &&
			file.name === '' &&
			file.size === 0 &&
			file.type === 'application/octet-stream')
	);
}
const JsonFile = z
	.instanceof(File, { message: 'File is required' })
	.refine(
		(file) => file.type === 'application/json',
		'Only JSON file is accepted',
	);

const schema = z.object({
	file: z.preprocess(
		(file) => (isEmptyFile(file) ? undefined : file),
		JsonFile,
	),
	files: z
		.preprocess(
			(files) =>
				isEmptyFile(files) ? [] : Array.isArray(files) ? files : [files],
			z.array(JsonFile).min(1, 'At least 1 file is required'),
		)
		.refine(
			(files) => files.reduce((size, file) => size + file.size, 0) < 5 * 1024,
			'Total file size must be less than 5kb',
		),
});

type Schema = z.infer<typeof schema>;

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData);

	try {
		schema.parse(submission.value);
	} catch (error) {
		submission.error.push(...formatError(error));
	}

	return json(submission);
}

export default function FileUpload() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const state = useActionData();
	const form = useForm<Schema>({
		state,
		onValidate: !noClientValidate
			? ({ formData }) => validate(formData, schema)
			: undefined,
	});
	const { file, files } = useFieldset<Schema>(form.ref, form.config);

	return (
		<Form method="post" {...form.props} encType="multipart/form-data">
			<Playground title="Employee Form" state={state}>
				<Alert message={form.error} />
				<Field label="Single file" error={file.error}>
					<input {...conform.input(file.config, { type: 'file' })} />
				</Field>
				<Field label="Multiple files" error={files.error}>
					<input {...conform.input(files.config, { type: 'file' })} multiple />
				</Field>
			</Playground>
		</Form>
	);
}
