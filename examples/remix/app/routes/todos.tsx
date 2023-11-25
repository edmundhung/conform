import type { FieldProps } from '@conform-to/react';
import {
	FormProvider,
	useForm,
	intent,
	useField,
	getFormProps,
	getInputProps,
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
	const form = useForm({
		lastResult,
		onValidate({ formData }) {
			return parse(formData, { schema: todosSchema });
		},
		shouldValidate: 'onBlur',
	});
	const tasks = form.fields.tasks;

	return (
		<FormProvider context={form.context}>
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
					<div key={task.key}>
						<TaskFieldset
							title={`Task #${index + 1}`}
							name={task.name}
							formId={form.id}
						/>
						<button {...intent.list.remove(tasks, { index })}>Delete</button>
						<button {...intent.list.reorder(tasks, { from: index, to: 0 })}>
							Move to top
						</button>
						<button
							{...intent.replace({
								formId: form.id,
								name: task.name,
								value: { content: '' },
							})}
						>
							Clear
						</button>
					</div>
				))}
				<button
					{...intent.list.insert(tasks, {
						defaultValue: { content: '' },
					})}
				>
					Add task
				</button>
				<hr />
				<button>Save</button>
			</Form>
		</FormProvider>
	);
}

interface TaskFieldsetProps extends FieldProps<z.input<typeof taskSchema>> {
	title: string;
}

function TaskFieldset({ title, name, formId }: TaskFieldsetProps) {
	const { fields } = useField({
		formId,
		name,
	});

	return (
		<fieldset>
			<div>
				<label>{title}</label>
				<input
					className={!fields.content.valid ? 'error' : ''}
					{...getInputProps(fields.content)}
				/>
				<div>{fields.content.errors}</div>
			</div>
			<div>
				<label>
					<span>Completed</span>
					<input
						className={!fields.completed.valid ? 'error' : ''}
						{...getInputProps(fields.completed, {
							type: 'checkbox',
						})}
					/>
				</label>
			</div>
		</fieldset>
	);
}
