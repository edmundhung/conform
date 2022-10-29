import type { FieldsetConfig } from '@conform-to/react';
import {
	useForm,
	useFieldset,
	useFieldList,
	conform,
	parse,
} from '@conform-to/react';
import { formatError, validate } from '@conform-to/zod';
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

function createTodos(data: unknown) {
	throw new Error('Not implemented');
}

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData);

	try {
		switch (submission.type) {
			case 'submit':
			case 'validate': {
				const data = todosSchema.parse(submission.value);

				if (submission.type === 'submit') {
					return await createTodos(data);
				}
			}
		}
	} catch (error) {
		submission.error.push(...formatError(error));
	}

	return json(submission);
};

export default function TodoForm() {
	const state = useActionData<typeof action>();
	const form = useForm<z.infer<typeof todosSchema>>({
		initialReport: 'onBlur',
		state,
		onValidate({ formData }) {
			return validate(formData, todosSchema);
		},
	});
	const { title, tasks } = useFieldset(form.ref, form.config);
	const [taskList, command] = useFieldList(form.ref, tasks.config);

	return (
		<Form method="post" {...form.props}>
			<fieldset>
				<legend>{form.error}</legend>
				<label>
					<div>Title</div>
					<input
						className={title.error ? 'error' : ''}
						{...conform.input(title.config)}
					/>
					<div>{title.error}</div>
				</label>
				<ul>
					{taskList.map((task, index) => (
						<li key={task.key}>
							<TaskFieldset title={`Task #${index + 1}`} {...task.config} />
							<button {...command.remove({ index })}>Delete</button>
							<button {...command.reorder({ from: index, to: 0 })}>
								Move to top
							</button>
							<button
								{...command.replace({ index, defaultValue: { content: '' } })}
							>
								Clear
							</button>
						</li>
					))}
				</ul>
				<div>
					<button {...command.append()}>Add task</button>
				</div>
			</fieldset>
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
			<label>
				<div>{title}</div>
				<input
					className={content.error ? 'error' : ''}
					{...conform.input(content.config)}
				/>
				<div>{content.error}</div>
			</label>
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
