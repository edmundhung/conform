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
	const lastResult = useActionData() as SubmissionResult<string[]>;
	const { meta, fields } = useForm({
		lastResult,
		onValidate({ formData }) {
			return parse(formData, { schema: todosSchema });
		},
	});
	const tasks = fields.tasks.getFieldList();

	return (
		<Form method="post" {...getFormProps(meta)}>
			<div>
				<label>Title</label>
				<input
					className={!fields.title.valid ? 'error' : ''}
					{...getInputProps(fields.title)}
				/>
				<div>{fields.title.error}</div>
			</div>
			<hr />
			<div className="form-error">{fields.tasks.error}</div>
			{tasks.map((task, index) => {
				const taskFields = task.getFieldset();

				return (
					<fieldset key={task.key} {...getFieldsetProps(task)}>
						<div>
							<label>Task #${index + 1}</label>
							<input
								className={!taskFields.content.valid ? 'error' : ''}
								{...getInputProps(taskFields.content)}
							/>
							<div>{taskFields.content.error}</div>
						</div>
						<div>
							<label>
								<span>Completed</span>
								<input
									className={!taskFields.completed.valid ? 'error' : ''}
									{...getInputProps(taskFields.completed, {
										type: 'checkbox',
									})}
								/>
							</label>
						</div>
						<button
							{...getControlButtonProps(meta.id, [
								intent.remove({ name: fields.tasks.name, index }),
							])}
						>
							Delete
						</button>
						<button
							{...getControlButtonProps(meta.id, [
								intent.reorder({ name: fields.tasks.name, from: index, to: 0 }),
							])}
						>
							Move to top
						</button>
						<button
							{...getControlButtonProps(meta.id, [
								intent.replace({ name: task.name, value: { content: '' } }),
							])}
						>
							Clear
						</button>
					</fieldset>
				);
			})}
			<button
				{...getControlButtonProps(meta.id, [
					intent.insert({ name: fields.tasks.name }),
				])}
			>
				Add task
			</button>
			<hr />
			<button>Save</button>
		</Form>
	);
}
