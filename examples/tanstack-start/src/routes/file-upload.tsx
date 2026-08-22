import { parseSubmission, report, useForm } from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v4/future';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn, useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { z } from 'zod';

const schema = coerceFormValue(
	z.object({
		title: z.string({ error: 'Title is required' }),
		file: z.file({ error: 'File is required' }),
	}),
);

const uploadFile = createServerFn({ method: 'POST' })
	.validator((formData: FormData) => parseSubmission(formData))
	.handler(async ({ data: submission }) => {
		const result = schema.safeParse(submission.payload);

		if (!result.success) {
			return report(submission, {
				error: { issues: result.error.issues },
			});
		}

		throw redirect({
			to: '/',
			search: {
				value: JSON.stringify({
					title: result.data.title,
					file: {
						name: result.data.file.name,
						size: result.data.file.size,
						type: result.data.file.type,
					},
				}),
			},
		});
	});

export const Route = createFileRoute('/file-upload')({ component: FileUpload });

function FileUpload() {
	const submit = useServerFn(uploadFile);
	const [lastResult, setLastResult] =
		useState<Awaited<ReturnType<typeof uploadFile>>>();
	const { form, fields } = useForm(schema, {
		lastResult,
		async onSubmit(event, { formData }) {
			event.preventDefault();
			const result = await submit({ data: formData });

			if (result) {
				setLastResult(result);
			}
		},
		shouldValidate: 'onBlur',
	});

	return (
		<form {...form.props} encType="multipart/form-data">
			<div>
				<label htmlFor={fields.title.id}>Title</label>
				<input
					id={fields.title.id}
					className={!fields.title.valid ? 'error' : ''}
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
					aria-invalid={!fields.title.valid || undefined}
					aria-describedby={fields.title.ariaDescribedBy}
				/>
				<div id={fields.title.errorId}>{fields.title.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.file.id}>File</label>
				<input
					id={fields.file.id}
					type="file"
					className={!fields.file.valid ? 'error' : ''}
					name={fields.file.name}
					aria-invalid={!fields.file.valid || undefined}
					aria-describedby={fields.file.ariaDescribedBy}
				/>
				<div id={fields.file.errorId}>{fields.file.errors}</div>
			</div>
			<hr />
			<button>Submit</button>
		</form>
	);
}
