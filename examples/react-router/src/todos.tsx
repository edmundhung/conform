import type { FieldsetConfig } from '@conform-to/react';
import { useForm, useFieldset, useFieldList, list } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionFunctionArgs } from 'react-router-dom';
import { Form, useActionData, json } from 'react-router-dom';
import { useRef } from 'react';
import { z } from 'zod';

const taskSchema = z.object({
	content: z.string({ required_error: 'Content is required' }),
	completed: z.boolean(),
});

const todosSchema = z.object({
	title: z.string({ required_error: 'Title is required' }),
	tasks: z.array(taskSchema).min(1),
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, {
		schema: todosSchema,
	});

	if (!submission.value || submission.intent !== 'submit') {
		return json(submission.report());
	}

	throw new Error('Not implemented');
}

export function Component() {
	const lastResult = useActionData() as any;
	const [form, { title, tasks }] = useForm({
		lastResult,
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
				<input className={title.error ? 'error' : ''} name={title.name} />
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
					type="text"
					name={content.name}
				/>
				<div>{content.error}</div>
			</div>
			<div>
				<label>
					<span>Completed</span>
					<input
						className={completed.error ? 'error' : ''}
						type="checkbox"
						name={completed.name}
						value="yes"
					/>
				</label>
			</div>
		</fieldset>
	);
}
