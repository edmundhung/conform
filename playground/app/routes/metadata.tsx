import {
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const schema = z.object({
	title: z.string({ message: 'Title is required' }),
	bookmarks: z
		.object({
			name: z.string({ message: 'Name is required' }),
			url: z.string({ message: 'Url is required' }).url('Url is invalid'),
		})
		.array()
		.refine(
			(bookmarks) =>
				new Set(bookmarks.map((bookmark) => bookmark.url)).size ===
				bookmarks.length,
			'Bookmark URLs are repeated',
		),
	file: z.file({ message: 'File is required' }),
	files: z
		.file()
		.array()
		.min(1, 'At least 1 file is required')
		.refine(
			(files) => files.every((file) => file.type === 'application/json'),
			'Only JSON file is accepted',
		),
});

const getPrintableValue = (value: unknown) => {
	if (typeof value === 'undefined') {
		return;
	}

	return JSON.parse(
		JSON.stringify(value, (key, value) => {
			if (value instanceof File) {
				return `${value.name} (${value.size} bytes)`;
			}

			return value;
		}),
	);
};

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
		id: 'example',
		lastResult,
		defaultValue: {
			bookmarks: [{}, {}],
			// The title is defined after the bookmarks to ensure the order of the fields doesn't matter for dirty checking
			title: 'Test',
		},
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});
	const bookmarks = fields.bookmarks.getFieldList();

	return (
		<Form method="post" {...getFormProps(form)} encType="multipart/form-data">
			<Playground
				title="Metadata"
				result={{
					form: {
						status: form.status,
						initialValue: form.initialValue,
						value: getPrintableValue(form.value),
						dirty: form.dirty,
						valid: form.valid,
						errors: form.errors,
						allErrors: form.allErrors,
					},
					title: {
						initialValue: fields.title.initialValue,
						value: fields.title.value,
						dirty: fields.title.dirty,
						valid: fields.title.valid,
						errors: fields.title.errors,
						allErrors: fields.title.allErrors,
					},
					bookmarks: {
						initialValue: fields.bookmarks.initialValue,
						value: fields.bookmarks.value,
						dirty: fields.bookmarks.dirty,
						valid: fields.bookmarks.valid,
						errors: fields.bookmarks.errors,
						allErrors: fields.bookmarks.allErrors,
					},
					'bookmarks[0]': {
						initialValue: bookmarks[0]?.initialValue,
						value: bookmarks[0]?.value,
						dirty: bookmarks[0]?.dirty,
						valid: bookmarks[0]?.valid,
						errors: bookmarks[0]?.errors,
						allErrors: bookmarks[0]?.allErrors,
					},
					'bookmarks[1]': {
						initialValue: bookmarks[1]?.initialValue,
						value: bookmarks[1]?.value,
						dirty: bookmarks[1]?.dirty,
						valid: bookmarks[1]?.valid,
						errors: bookmarks[1]?.errors,
						allErrors: bookmarks[1]?.allErrors,
					},
					file: {
						initialValue: fields.file.initialValue,
						value: getPrintableValue(fields.file.value),
						dirty: fields.file.dirty,
						valid: fields.file.valid,
						errors: fields.file.errors,
						allErrors: fields.file.allErrors,
					},
					files: {
						initialValue: fields.files.initialValue,
						value: getPrintableValue(fields.files.value),
						dirty: fields.files.dirty,
						valid: fields.files.valid,
						errors: fields.files.errors,
						allErrors: fields.files.allErrors,
					},
				}}
			>
				<Field label="Title" meta={fields.title}>
					<input {...getInputProps(fields.title, { type: 'text' })} />
				</Field>
				<Alert id={fields.bookmarks.errorId} errors={fields.bookmarks.errors} />
				{bookmarks.map((bookmark, index) => {
					const { name, url } = bookmark.getFieldset();

					return (
						<fieldset key={bookmark.key} {...getFieldsetProps(bookmark)}>
							<legend className="mt-2 mb-4">Bookmark #{index + 1}</legend>
							<Field label="Name" meta={name}>
								<input {...getInputProps(name, { type: 'text' })} />
							</Field>
							<Field label="Url" meta={url}>
								<input {...getInputProps(url, { type: 'text' })} />
							</Field>
						</fieldset>
					);
				})}
				<Field label="File" meta={fields.file}>
					<input {...getInputProps(fields.file, { type: 'file' })} />
				</Field>
				<Field label="Files" meta={fields.files}>
					<input {...getInputProps(fields.files, { type: 'file' })} multiple />
				</Field>
			</Playground>
		</Form>
	);
}
