import type { FieldsetConfig } from '@conform-to/react';
import {
	conform,
	useForm,
	useFieldset,
	useFieldList,
	list,
} from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionFunctionArgs } from 'react-router-dom';
import { Form, useActionData, json, redirect } from 'react-router-dom';
import { useRef } from 'react';
import { z } from 'zod';

const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean(),
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

	if (!submission.value || submission.intent !== 'submit') {
		return json(submission);
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export function Component() {
	const lastSubmission = useActionData() as any;
	const [form, { title, tasks }] = useForm({
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, { schema: todosSchema });
		},
	});
	const taskList = useFieldList(form.ref, tasks);

	return (
		<Form method="post" {...form.props}>
			<div>
				<label>Title</label>
				<input
					className={title.error ? 'error' : ''}
					{...conform.input(title)}
				/>
				<div>{title.error}</div>
			</div>
			<hr />
			<div className="form-error">{tasks.error}</div>
			{taskList.map((task, index) => (
				<p key={task.key}>
					<TaskFieldset title={`Task #${index + 1}`} config={task} />
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
			<button>Save</button>
		</Form>
	);
}

interface TaskFieldsetProps {
	title: string;
	config: FieldsetConfig<z.input<typeof taskSchema>>;
}

function TaskFieldset({ title, config }: TaskFieldsetProps) {
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
						})}
					/>
				</label>
			</div>
		</fieldset>
	);
}
