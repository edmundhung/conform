import { conform, parse, useFieldset, useForm } from '@conform-to/react';
import { formatError, validate } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

const schema = z.object({
	files: z
		.array(z.instanceof(File, { message: 'Please select at least one file' }))
		.refine(
			(files) => files.every((file) => file.type === 'application/json'),
			'All files must be JSON',
		),
});

type Schema = z.infer<typeof schema>;

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData);

	try {
		const data = schema.parse(submission.value);

		console.log(data);
	} catch (error) {
		submission.error.push(...formatError(error));
	}

	return json(submission);
};

export default function EmployeeForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Schema>({
		...config,
		state,
		onValidate: config.validate
			? ({ formData }) => validate(formData, schema)
			: undefined,
		onSubmit:
			config.mode === 'server-validation'
				? (event, { submission }) => {
						if (submission.type === 'validate') {
							event.preventDefault();
						}
				  }
				: undefined,
	});
	const { files } = useFieldset<Schema>(form.ref, {
		...form.config,
		constraint: {
			files: {
				multiple: true,
			},
		},
	});

	return (
		<Form method="post" {...form.props} encType="multipart/form-data">
			<Playground title="Employee Form" state={state}>
				<Alert message={form.error} />
				<Field label="Files" error={files.error}>
					<input {...conform.input(files.config, { type: 'file' })} />
				</Field>
			</Playground>
		</Form>
	);
}
