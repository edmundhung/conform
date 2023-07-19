import {
	type FieldsetConfig,
	conform,
	useFieldList,
	useFieldset,
	useForm,
	list,
	report,
} from '@conform-to/react';
import { parse, getFieldsetConstraint } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useRef } from 'react';
import { z } from 'zod';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

const schema = z.object({
	title: z.string({ required_error: 'Title is required' }),
	tasks: z.array(
		z.object({
			content: z.string({ required_error: 'Content is required' }),
			completed: z
				.string()
				.optional()
				.transform((value) => value === 'on'),
		}),
	),
});

export async function loader({ request }: LoaderArgs) {
	return parseConfig(request);
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	return json(report(submission));
}

export default function TodosForm() {
	const config = useLoaderData();
	const lastSubmission = useActionData();
	const [form, { title, tasks }] = useForm<z.infer<typeof schema>>({
		...config,
		lastSubmission,
		constraint: getFieldsetConstraint(schema),
		onValidate: config.validate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});
	const taskList = useFieldList(form.ref, tasks);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Todos Form" lastSubmission={lastSubmission}>
				<fieldset>
					<Field label="Title" config={title}>
						<input {...conform.input(title, { type: 'text' })} />
					</Field>
					<ol>
						{taskList.map((task, index) => (
							<li key={task.key} className="border rounded-md p-4 mb-4">
								<TaskFieldset {...task} />
								<div className="flex flex-row gap-2">
									<button
										className="rounded-md border p-2 hover:border-black"
										{...list.remove(tasks.name, { index })}
									>
										Delete
									</button>
									<button
										className="rounded-md border p-2 hover:border-black"
										{...list.reorder(tasks.name, { from: index, to: 0 })}
									>
										Move to top
									</button>
									<button
										className="rounded-md border p-2 hover:border-black"
										{...list.replace(tasks.name, {
											index,
											defaultValue: { content: '' },
										})}
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
							{...list.prepend(tasks.name)}
						>
							Insert top
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...list.append(tasks.name)}
						>
							Insert bottom
						</button>
					</div>
				</fieldset>
			</Playground>
		</Form>
	);
}
export function TaskFieldset(
	config: FieldsetConfig<z.infer<typeof schema.shape.tasks.element>>,
) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { content, completed } = useFieldset(ref, {
		...config,
		constraint: getFieldsetConstraint(schema.shape.tasks.element),
	});
	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Content" config={content}>
				<input {...conform.input(content, { type: 'text' })} />
			</Field>
			<Field label="Completed" config={completed} inline>
				<input {...conform.input(completed, { type: 'checkbox' })} />
			</Field>
		</fieldset>
	);
}
