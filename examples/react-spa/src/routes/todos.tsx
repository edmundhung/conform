import { coerceFormValue, resolveZodResult } from '@conform-to/zod/v3/future';
import { z } from 'zod';
import { useState } from 'react';
import { isDirty, useForm, useFormData } from '@conform-to/react/future';

const taskSchema = coerceFormValue(
	z.object({
		content: z.string(),
		completed: z.boolean().default(false),
	}),
);

const todosSchema = coerceFormValue(
	z.object({
		title: z.string(),
		tasks: z.array(taskSchema).nonempty(),
	}),
);

async function handleSave(value: z.infer<typeof todosSchema>) {
	await new Promise((resolve) => {
		setTimeout(resolve, Math.random() * 1000);
	});

	if (value.tasks.length > 3) {
		return 'Max 3 tasks';
	}

	return null;
}

export default function Todos() {
	const [defaultValue, setDefaultValue] = useState<z.infer<
		typeof todosSchema
	> | null>(null);
	const { form, fields, intent } = useForm({
		defaultValue,
		onValidate(value) {
			const result = todosSchema.safeParse(value);
			return resolveZodResult(result, { includeValue: true });
		},
		async onSubmit(event, { value, update }) {
			event.preventDefault();

			const error = await handleSave(value);
			setDefaultValue(value);

			if (error) {
				update({
					error: {
						formErrors: [error],
					},
				});
			} else {
				update({
					reset: true,
				});
			}
		},
	});
	const dirty = useFormData(
		form.id,
		(formData) => isDirty(formData, { defaultValue }) ?? false,
	);
	const tasks = fields.tasks.getFieldList();

	return (
		<form {...form.props} method="post">
			<div>
				<label>Title</label>
				<input
					className={fields.title.invalid ? 'error' : ''}
					name={fields.title.name}
					defaultValue={fields.title.defaultValue ?? ''}
				/>
				<div>{fields.title.errors}</div>
			</div>
			<hr />
			<div className="form-error">{fields.tasks.errors}</div>
			{tasks.map((task, index) => {
				const taskFields = task.getFieldset();

				return (
					<fieldset key={task.key}>
						<div>
							<label>Task #{index + 1}</label>
							<input
								className={taskFields.content.invalid ? 'error' : ''}
								name={taskFields.content.name}
								defaultValue={taskFields.content.defaultValue}
							/>
							<div>{taskFields.content.errors}</div>
						</div>
						<div>
							<label>
								<span>Completed</span>
								<input
									type="checkbox"
									className={taskFields.completed.invalid ? 'error' : ''}
									name={taskFields.completed.name}
									defaultChecked={taskFields.completed.defaultChecked}
								/>
							</label>
						</div>
						<button
							type="button"
							onClick={() => {
								intent.remove({ name: fields.tasks.name, index });
							}}
						>
							Delete
						</button>
						<button
							type="button"
							onClick={() => {
								intent.reorder({
									name: fields.tasks.name,
									from: index,
									to: 0,
								});
							}}
						>
							Move to top
						</button>
						<button
							type="button"
							onClick={() => {
								intent.update({
									name: task.name,
									value: { content: '' },
								});
							}}
						>
							Clear
						</button>
					</fieldset>
				);
			})}
			<button
				type="button"
				onClick={() =>
					intent.insert({
						name: fields.tasks.name,
					})
				}
			>
				Add task
			</button>
			<hr />
			<button disabled={!dirty}>Save</button>
			<button type="button" onClick={() => intent.reset()}>
				Reset
			</button>
		</form>
	);
}
