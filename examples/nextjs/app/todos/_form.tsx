'use client';

import { resolveZodResult } from 'conform-zod';
import { useActionState } from 'react';
import type { z } from 'zod';
import { useForm } from '@/app/_template';
import { createTodos } from './_action';
import { todosSchema } from './_schema';
import { isDirty, useFormData } from 'conform-react';

export function TodoForm({
	defaultValue,
}: {
	defaultValue?: z.infer<typeof todosSchema> | null;
}) {
	const [lastResult, action] = useActionState(createTodos, null);
	const { form, fields, intent } = useForm({
		lastResult,
		defaultValue,
		onValidate(value) {
			return resolveZodResult(todosSchema.safeParse(value));
		},
	});
	const dirty = useFormData(form.props.ref, (formData) =>
		isDirty(formData, {
			defaultValue,
			skipEntry(name) {
				// We need to skip NextJS internal fields when checking for dirty state
				return name.startsWith('$ACTION_');
			},
		}),
	);
	const tasks = fields.tasks.getFieldList();

	return (
		<form {...form.props} action={action}>
			<div>
				<label>Title</label>
				<input
					className={fields.title.invalid ? 'error' : ''}
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
