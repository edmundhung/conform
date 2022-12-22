import {
	conform,
	parse,
	useFieldList,
	useFieldset,
	useForm,
} from '@conform-to/react';
import { formatError, validate } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

const schema = z.object({
	sections: z.array(z.string().min(1, 'The field is required')),
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
	const { sections } = useFieldset(form.ref, form.config);
	const [sectionList, command] = useFieldList(form.ref, sections.config);

	return (
		<Form method="post" {...form.props} encType="multipart/form-data">
			<Playground title="Simple list" state={state}>
				<Alert message={form.error} />
				<ol>
					{sectionList.map((section, index) => (
						<li key={section.key} className="border rounded-md p-4 mb-4">
							<Field
								key={section.key}
								label={`Section #${index + 1}`}
								error={section.error}
							>
								<textarea {...conform.input(section.config)} />
							</Field>
							<div className="flex flex-row gap-2">
								<button
									className="rounded-md border p-2 hover:border-black"
									{...command.remove({ index })}
								>
									Delete
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...command.reorder({ from: index, to: 0 })}
								>
									Move to top
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...command.replace({ index, defaultValue: '' })}
								>
									Clear
								</button>
							</div>
						</li>
					))}
				</ol>
				<div className="flex flex-row gap-2">
					<button
						className="rounded-md border p-2 hover:border-black"
						{...command.prepend()}
					>
						Insert top
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...command.append()}
					>
						Insert bottom
					</button>
				</div>
			</Playground>
		</Form>
	);
}
