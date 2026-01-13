'use client';

import { useActionState } from 'react';
import type { z } from 'zod';
import { useForm, useFormData, isDirty } from '@conform-to/react/future';
import { createTodos } from './_action';
import { schema } from './_schema';

export function TodoForm({
	defaultValue,
}: {
	defaultValue?: z.infer<typeof schema> | null;
}) {
	const [lastResult, action] = useActionState(createTodos, null);
	const { form, fields, intent } = useForm(schema, {
		lastResult,
		shouldValidate: 'onBlur',
		defaultValue,
	});
	const dirty = useFormData(form.id, (formData) =>
		isDirty(formData, {
			defaultValue,
			skipEntry(name) {
				// We need to skip NextJS internal fields when checking for dirty state
				return name.startsWith('$ACTION_');
			},
		}),
	) ?? false;
	const tasks = fields.tasks.getFieldList();

	return (
		<form {...form.props} action={action}>
			<div>
				<label>Title</label>
				<input
					className={!fields.title.valid ? 'error' : ''}
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
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
								className={!taskFields.content.valid ? 'error' : ''}
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
									className={!taskFields.completed.valid ? 'error' : ''}
									name={taskFields.completed.name}
									defaultChecked={taskFields.completed.defaultValue === 'on'}
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
		</form>
	);
}
