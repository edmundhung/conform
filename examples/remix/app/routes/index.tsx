import type { FieldsetConfig } from '@conform-to/react';
import { useForm, useFieldset, useFieldList } from '@conform-to/react';
import { ifNonEmptyString, resolve } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { useRef } from 'react';
import { z } from 'zod';

const Task = resolve(
	z.object({
		content: z.string(),
		completed: z.preprocess(
			ifNonEmptyString((value) => value === 'yes'),
			z.boolean(),
		),
	}),
);

const Todo = resolve(
	z.object({
		title: z.string(),
		tasks: z.array(Task.source).min(1),
	}),
);

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = Todo.parse(formData);

	if (submission.state !== 'accepted') {
		return submission.form;
	}

	console.log('Submission', submission.data);
};

export default function OrderForm() {
	const formState = useActionData<typeof action>();
	const formProps = useForm({
		initialReport: 'onBlur',
		validate: Todo.validate,
	});
	const { title, tasks } = useFieldset<z.infer<typeof Todo.source>>(
		formProps.ref,
		{
			defaultValue: formState?.value,
			initialError: formState?.error.details,
		},
	);
	const [taskList, control] = useFieldList(formProps.ref, tasks.config);

	return (
		<Form method="post" {...formProps}>
			<fieldset>
				<label>
					<div>Title</div>
					<input
						className={title.error ? 'error' : ''}
						name={title.config.name}
						defaultValue={title.config.defaultValue}
					/>
					<div>{title.error}</div>
				</label>
				<ul>
					{taskList.map((task, index) => (
						<li key={task.key}>
							<TaskFieldset title={`Task #${index + 1}`} {...task.config} />
							<button {...control.remove({ index })}>Delete</button>
							<button {...control.reorder({ from: index, to: 0 })}>
								Move to top
							</button>
							<button
								{...control.replace({ index, defaultValue: { content: '' } })}
							>
								Clear
							</button>
						</li>
					))}
				</ul>
				<button
					hidden
					name={tasks.config.name}
					className={tasks.error ? 'error' : ''}
				/>
				<div>{tasks.error}</div>
				<div>
					<button {...control.append()}>Add task</button>
				</div>
			</fieldset>
			<button type="submit">Save</button>
		</Form>
	);
}

interface TaskFieldsetProps
	extends FieldsetConfig<z.infer<typeof Task.source>> {
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
					type="text"
					className={content.error ? 'error' : ''}
					name={content.config.name}
					defaultValue={content.config.defaultValue}
				/>
				<div>{content.error}</div>
			</label>
			<div>
				<label>
					<span>Completed</span>
					<input
						type="checkbox"
						className={completed.error ? 'error' : ''}
						name={completed.config.name}
						value="yes"
						defaultChecked={completed.config.defaultValue === 'yes'}
					/>
				</label>
			</div>
		</fieldset>
	);
}
