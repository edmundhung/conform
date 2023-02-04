import type { FieldsetConfig } from '@conform-to/react';
import {
	useForm,
	useFieldset,
	useFieldList,
	conform,
	list,
} from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { useRef } from 'react';
import { z } from 'zod';

const taskSchema = z.object({
	content: z.string().min(1, 'Content is required'),
	completed: z.preprocess((value) => value === 'yes', z.boolean().optional()),
});

const todosSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	tasks: z.array(taskSchema).min(1),
});

type Schema = z.infer<typeof todosSchema>;

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData, {
		schema: todosSchema,
	});

	if (!submission.data || submission.intent !== 'submit') {
		return json(submission);
	}

	throw new Error('Not implemented');
};

export default function TodoForm() {
	const state = useActionData<typeof action>();
	const [form, { title, tasks }] = useForm<Schema>({
		initialReport: 'onBlur',
		state,
		onValidate({ formData }) {
			return parse(formData, { schema: todosSchema });
		},
	});
	const taskList = useFieldList(form.ref, tasks.config);

	return (
		<Form method="post" {...form.props}>
			<div>{form.error}</div>
			<div>
				<label>Title</label>
				<input
					className={title.error ? 'error' : ''}
					{...conform.input(title.config)}
				/>
				<div>{title.error}</div>
			</div>
			<ul>
				{taskList.map((task, index) => (
					<li key={task.key}>
						<TaskFieldset title={`Task #${index + 1}`} {...task.config} />
						<button {...list.remove(tasks.config.name, { index })}>
							Delete
						</button>
						<button
							{...list.reorder(tasks.config.name, { from: index, to: 0 })}
						>
							Move to top
						</button>
						<button
							{...list.replace(tasks.config.name, {
								index,
								defaultValue: { content: '' },
							})}
						>
							Clear
						</button>
					</li>
				))}
			</ul>
			<div>
				<button {...list.append(tasks.config.name)}>Add task</button>
			</div>
			<button type="submit">Save</button>
		</Form>
	);
}

interface TaskFieldsetProps extends FieldsetConfig<z.infer<typeof taskSchema>> {
	title: string;
}

function TaskFieldset({ title, ...config }: TaskFieldsetProps) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { content, completed } = useFieldset(ref, config);

	return (
		<fieldset ref={ref}>
			<div>
				<label>{title}</label>
				<input
					className={content.error ? 'error' : ''}
					{...conform.input(content.config)}
				/>
				<div>{content.error}</div>
			</div>
			<div>
				<label>
					<span>Completed</span>
					<input
						className={completed.error ? 'error' : ''}
						{...conform.input(completed.config, {
							type: 'checkbox',
							value: 'yes',
						})}
					/>
				</label>
			</div>
		</fieldset>
	);
}
