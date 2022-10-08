import type { FieldsetConfig } from '@conform-to/react';
import {
	useForm,
	useFieldset,
	useFieldList,
	conform,
	parse,
	setFormError,
} from '@conform-to/react';
import { getError } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { useRef } from 'react';
import { z } from 'zod';

const taskSchema = z.object({
	content: z.string(),
	completed: z.preprocess((value) => value === 'yes', z.boolean().optional()),
});

const todoSchema = z.object({
	title: z.string(),
	tasks: z.array(taskSchema).min(1),
});

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const state = parse(formData);
	const result = todoSchema.safeParse(state.value);
	const error = !result.success
		? state.error.concat(getError(result.error))
		: state.error;

	if (error.length > 0) {
		return json({
			...state,
			error,
		});
	}

	console.log('result', result);
	return redirect('/');
};

export default function OrderForm() {
	const state = useActionData<typeof action>();
	const form = useForm({
		state,
		validate(formData, form) {
			const state = parse(formData);
			const result = todoSchema.safeParse(state.value);
			const error = !result.success
				? state.error.concat(getError(result.error))
				: state.error;

			setFormError(form, error);
		},
	});
	const { title, tasks } = useFieldset<z.infer<typeof todoSchema>>(
		form.ref,
		form.config,
	);
	const [taskList, control] = useFieldList(form.ref, tasks.config);

	return (
		<Form method="post" {...form.props}>
			<fieldset>
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
				<div>
					<button {...control.append()}>Add task</button>
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
