import { formatPaths, parse } from '@conform-to/dom';
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z, type ZodIssue } from 'zod';
import { Playground, Field, Alert } from '~/components';

const JsonFile = z
	.instanceof(Blob, { message: 'File is required' })
	.refine(
		(file) => file.type === 'application/json',
		'Only JSON file is accepted',
	);

function isEmptyFile(value: unknown) {
	if (value instanceof File) {
		return value.name === '' && value.size === 0;
	}

	return (
		value instanceof Blob &&
		value.type === 'application/octet-stream' &&
		value.size === 0
	);
}

function normalizeFile(value: unknown) {
	if (isEmptyFile(value)) {
		return undefined;
	}

	return value;
}

function normalizeFiles(value: unknown) {
	const files = Array.isArray(value)
		? value
		: typeof value !== 'undefined'
			? [value]
			: [];

	return files.filter((file) => !isEmptyFile(file));
}

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

function getError(issues: Array<ZodIssue>) {
	const result: Record<string, string[]> = {};

	for (const issue of issues) {
		const name = formatPaths(issue.path);
		const current = result[name];

		result[name] = current ? current.concat(issue.message) : [issue.message];
	}

	return result;
}

function parseFileUpload(payload: FormData) {
	return parse(payload, {
		resolve(payload) {
			const result = schema.safeParse({
				file: normalizeFile(payload.file),
				files: normalizeFiles(payload.files),
			});

			return {
				value: result.success ? result.data : undefined,
				error: result.success ? undefined : getError(result.error.issues),
			};
		},
	});
}

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseFileUpload(formData);

	return json(submission.reply());
}

export default function FileUpload() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...getFormProps(form)} encType="multipart/form-data">
			<Playground title="Employee Form" result={lastResult}>
				<Alert errors={form.errors} />
				<Field label="Single file" meta={fields.file}>
					<input {...getInputProps(fields.file, { type: 'file' })} />
				</Field>
				<Field label="Multiple files" meta={fields.files}>
					<input {...getInputProps(fields.files, { type: 'file' })} multiple />
				</Field>
			</Playground>
		</Form>
	);
}
