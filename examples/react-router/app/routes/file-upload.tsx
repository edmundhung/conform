import { parseSubmission, report, useForm } from '@conform-to/react/future';
import { z } from 'zod';
import { Form, redirect } from 'react-router';
import type { Route } from './+types/file-upload';
import { coerceFormValue } from '@conform-to/zod/v3/future';

const schema = coerceFormValue(
	z.object({
		title: z.string().min(1, 'Title is required'),
		file: z.instanceof(File, { message: 'File is required' }),
	}),
);

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData);
	const result = schema.safeParse(submission.payload);

	if (!result.success) {
		return {
			result: report(submission, {
				error: {
					issues: result.error.issues,
				},
			}),
		};
	}

	throw redirect(`/?value=${JSON.stringify(submission.payload)}`);
}

export default function Login({ actionData }: Route.ComponentProps) {
	const { form, fields } = useForm(schema, {
		lastResult: actionData?.result,
		shouldValidate: 'onBlur',
	});

	return (
		<Form method="post" encType="multipart/form-data" {...form.props}>
			<div>
				<label htmlFor={fields.title.id}>Title</label>
				<input
					id={fields.title.id}
					type="text"
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
		</Form>
	);
}
