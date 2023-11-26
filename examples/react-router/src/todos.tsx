import type { SubmissionResult } from '@conform-to/react';
import {
	useForm,
	intent,
	getFormProps,
	getInputProps,
	getFieldsetProps,
	getControlButtonProps,
} from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionFunctionArgs } from 'react-router-dom';
import { Form, useActionData, json, redirect } from 'react-router-dom';
import { z } from 'zod';

const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean().optional(),
});

const todosSchema = z.object({
	title: z.string(),
	tasks: z.array(taskSchema).nonempty(),
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, {
		schema: todosSchema,
	});

	if (!submission.value) {
		return json(submission.reject());
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export function Component() {
	const lastResult = useActionData() as SubmissionResult;
	const form = useForm({
		lastResult,
		onValidate({ formData }) {
			return parse(formData, { schema: todosSchema });
		},
	});
	const tasks = form.fields.tasks;

	return (
		<Form method="post" {...getFormProps(form)}>
			<div>
				<label>Title</label>
				<input
					className={!form.fields.title.valid ? 'error' : ''}
					{...getInputProps(form.fields.title)}
				/>
				<div>{form.fields.title.errors}</div>
			</div>
			<hr />
			<div className="form-error">{tasks.errors}</div>
			{tasks.items.map((task, index) => (
				<fieldset key={task.key} {...getFieldsetProps(task)}>
					<div>
						<label>Task #${index + 1}</label>
						<input
							className={!task.fields.content.valid ? 'error' : ''}
							{...getInputProps(task.fields.content)}
						/>
						<div>{task.fields.content.errors}</div>
					</div>
					<div>
						<label>
							<span>Completed</span>
							<input
								className={!task.fields.completed.valid ? 'error' : ''}
								{...getInputProps(task.fields.completed, {
									type: 'checkbox',
								})}
							/>
						</label>
					</div>
					<button
						{...getControlButtonProps(
							form.id,
							intent.remove({ name: tasks.name, index }),
						)}
					>
						Delete
					</button>
					<button
						{...getControlButtonProps(
							form.id,
							intent.reorder({ name: tasks.name, from: index, to: 0 }),
						)}
					>
						Move to top
					</button>
					<button
						{...getControlButtonProps(
							form.id,
							intent.replace({ value: { content: '' } }),
						)}
					>
						Clear
					</button>
				</fieldset>
			))}
			<button
				{...getControlButtonProps(form.id, intent.insert({ name: tasks.name }))}
			>
				Add task
			</button>
			<hr />
			<button>Save</button>
		</Form>
	);
}
