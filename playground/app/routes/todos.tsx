import {
	type FieldsetConfig,
	conform,
	useFieldList,
	useFieldset,
	useForm,
	list,
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
	title: z.string().min(1, 'Title is required'),
	tasks: z.array(
		z.object({
			content: z.string().min(1, 'Content is required'),
			completed: z.preprocess(
				(value) => value === 'on',
				z.boolean().optional(),
			),
		}),
	),
});

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	return json(submission);
};

export default function TodosForm() {
	const config = useLoaderData();
	const state = useActionData();
	const [form] = useForm({
		...config,
		state,
		onValidate: config.validate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Todos Form" state={state}>
				<TodosFieldset {...form.config} />
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
			<Field label="Content" {...content}>
				<input {...conform.input(content.config, { type: 'text' })} />
			</Field>
			<Field label="Completed" error={completed.error} inline>
				<input {...conform.input(completed.config, { type: 'checkbox' })} />
			</Field>
		</fieldset>
	);
}

export function TodosFieldset(config: FieldsetConfig<z.infer<typeof schema>>) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { title, tasks } = useFieldset(ref, {
		...config,
		constraint: getFieldsetConstraint(schema),
	});
	const taskList = useFieldList(ref, tasks.config);

	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Title" {...title}>
				<input {...conform.input(title.config, { type: 'text' })} />
			</Field>
			<ol>
				{taskList.map((task, index) => (
					<li key={task.key} className="border rounded-md p-4 mb-4">
						<TaskFieldset {...task.config} />
						<div className="flex flex-row gap-2">
							<button
								className="rounded-md border p-2 hover:border-black"
								{...list.remove(tasks.config.name, { index })}
							>
								Delete
							</button>
							<button
								className="rounded-md border p-2 hover:border-black"
								{...list.reorder(tasks.config.name, { from: index, to: 0 })}
							>
								Move to top
							</button>
							<button
								className="rounded-md border p-2 hover:border-black"
								{...list.replace(tasks.config.name, {
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
					{...list.prepend(tasks.config.name)}
				>
					Insert top
				</button>
				<button
					className="rounded-md border p-2 hover:border-black"
					{...list.append(tasks.config.name)}
				>
					Insert bottom
				</button>
			</div>
		</fieldset>
	);
}
