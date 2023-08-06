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
	content: z.string({ required_error: 'Content is required' }),
	completed: z.string().transform((value) => value === 'yes'),
});

const todosSchema = z.object({
	title: z.string({ required_error: 'Title is required' }),
	tasks: z.array(taskSchema).min(1),
});

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, {
		schema: todosSchema,
	});

	if (!submission.value || submission.intent !== 'submit') {
		return json(submission);
	}

	throw new Error('Not implemented');
}

export default function TodoForm() {
	const lastSubmission = useActionData<typeof action>();
	const [form, { title, tasks }] = useForm({
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, { schema: todosSchema });
		},
	});
	const taskList = useFieldList(form.ref, tasks);

	return (
		<Form method="post" {...form.props}>
			<div className="form-error">{form.error}</div>
			<div>
				<label>Title</label>
				<input
					className={title.error ? 'error' : ''}
					{...conform.input(title)}
				/>
				<div>{title.error}</div>
			</div>
			{taskList.map((task, index) => (
				<p key={task.key}>
					<TaskFieldset title={`Task #${index + 1}`} {...task} />
					<button {...list.remove(tasks.name, { index })}>Delete</button>
					<button {...list.reorder(tasks.name, { from: index, to: 0 })}>
						Move to top
					</button>
					<button
						{...list.replace(tasks.name, {
							index,
							defaultValue: { content: '' },
						})}
					>
						Clear
					</button>
				</p>
			))}
			<button {...list.append(tasks.name)}>Add task</button>
			<hr />
			<button type="submit">Save</button>
		</Form>
	);
}

interface TaskFieldsetProps extends FieldsetConfig<z.input<typeof taskSchema>> {
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
					{...conform.input(content)}
				/>
				<div>{content.error}</div>
			</div>
			<div>
				<label>
					<span>Completed</span>
					<input
						className={completed.error ? 'error' : ''}
						{...conform.input(completed, {
							type: 'checkbox',
							value: 'yes',
						})}
					/>
				</label>
			</div>
		</fieldset>
	);
}
