import type { Field } from '@conform-to/react';
import {
	useForm,
	useFieldset,
	useFieldList,
	conform,
	intent,
	ConformBoundary,
} from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean().optional(),
});

const todosSchema = z.object({
	title: z.string(),
	tasks: z.array(taskSchema).nonempty(),
});

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, {
		schema: todosSchema,
	});

	if (!submission.value) {
		return json(submission.reject());
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export default function TodoForm() {
	const lastResult = useActionData<typeof action>();
	const { form, fields, context } = useForm({
		lastResult,
		onValidate({ formData }) {
			return parse(formData, { schema: todosSchema });
		},
		shouldValidate: 'onBlur',
	});
	const taskList = useFieldList({
		formId: form.id,
		name: fields.tasks.name,
		context,
	});

	return (
		<ConformBoundary context={context}>
			<Form method="post" {...conform.form(form)}>
				<div>
					<label>Title</label>
					<input
						className={fields.title.error ? 'error' : ''}
						{...conform.input(fields.title)}
					/>
					<div>{fields.title.error}</div>
				</div>
				<hr />
				<div className="form-error">{fields.tasks.error}</div>
				{taskList.map((task, index) => (
					<p key={task.key}>
						<TaskFieldset
							title={`Task #${index + 1}`}
							name={task.name}
							formId={form.id}
						/>
						<button {...intent.list.remove(fields.tasks, { index })}>
							Delete
						</button>
						<button
							{...intent.list.reorder(fields.tasks, { from: index, to: 0 })}
						>
							Move to top
						</button>
						<button
							{...intent.list.replace(fields.tasks, {
								index,
								defaultValue: { content: '' },
							})}
						>
							Clear
						</button>
					</p>
				))}
				<button
					{...intent.list.insert(fields.tasks, {
						defaultValue: { content: '' },
					})}
				>
					Add task
				</button>
				<hr />
				<button>Save</button>
			</Form>
		</ConformBoundary>
	);
}

interface TaskFieldsetProps extends Field<z.input<typeof taskSchema>> {
	title: string;
}

function TaskFieldset({ title, name, formId }: TaskFieldsetProps) {
	const fields = useFieldset({
		formId,
		name,
	});

	return (
		<fieldset>
			<div>
				<label>{title}</label>
				<input
					className={fields.content.error ? 'error' : ''}
					{...conform.input(fields.content)}
				/>
				<div>{fields.content.error}</div>
			</div>
			<div>
				<label>
					<span>Completed</span>
					<input
						className={fields.completed.error ? 'error' : ''}
						{...conform.input(fields.completed, {
							type: 'checkbox',
						})}
					/>
				</label>
			</div>
		</fieldset>
	);
}
