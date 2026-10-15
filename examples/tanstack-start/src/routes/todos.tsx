import {
	isDirty,
	parseSubmission,
	report,
	useForm,
	useFormData,
} from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v4/future';
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn, useServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { useState } from 'react';
import { z } from 'zod';
import { todoStore } from '#/store.server';

const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean().default(false),
});

const todosSchema = z.object({
	title: z.string(),
	tasks: z.array(taskSchema).nonempty(),
});

const schema = coerceFormValue(todosSchema);

const getTodos = createServerFn({ method: 'GET' })
	.validator((data: { id?: string }) => data)
	.handler(({ data }) => {
		setResponseHeader('Cache-Control', 'no-store');
		return todoStore.getValue(data.id);
	});

const saveTodos = createServerFn({ method: 'POST' })
	.validator((formData: FormData) => parseSubmission(formData))
	.handler(async ({ data: submission }) => {
		const id = submission.payload.id;
		const storeId = typeof id === 'string' ? id : undefined;
		const result = schema.safeParse(submission.payload);

		if (!result.success) {
			return report(submission, {
				error: { issues: result.error.issues },
			});
		}

		await todoStore.setValue(result.data, storeId);

		return report(submission, {
			reset: true,
			targetValue: result.data,
		});
	});

export const Route = createFileRoute('/todos')({
	validateSearch: (search: Record<string, unknown>) => ({
		id: typeof search.id === 'string' ? search.id : undefined,
	}),
	loaderDeps: ({ search }) => ({ id: search.id }),
	loader: ({ deps }) => getTodos({ data: deps }),
	component: Todos,
});

function Todos() {
	const defaultValue = Route.useLoaderData();
	const { id } = Route.useSearch();
	const submit = useServerFn(saveTodos);
	const [lastResult, setLastResult] =
		useState<Awaited<ReturnType<typeof saveTodos>>>();
	const { form, fields, intent } = useForm(schema, {
		lastResult,
		async onSubmit(event, { formData }) {
			event.preventDefault();
			const result = await submit({ data: formData });

			if (result) {
				setLastResult(result);
			}
		},
		defaultValue,
		shouldValidate: 'onBlur',
	});
	const dirty = useFormData(form.id, (formData) =>
		isDirty(formData, {
			defaultValue: form.defaultValue,
			skipEntry(name) {
				return name === 'id';
			},
		}),
	);
	const tasks = fields.tasks.getFieldList();

	return (
		<form {...form.props}>
			{id ? <input type="hidden" name="id" value={id} /> : null}
			<div>
				<label htmlFor={fields.title.id}>Title</label>
				<input
					id={fields.title.id}
					className={!fields.title.valid ? 'error' : ''}
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
					aria-invalid={!fields.title.valid || undefined}
					aria-describedby={fields.title.ariaDescribedBy}
				/>
				<div id={fields.title.errorId}>{fields.title.errors}</div>
			</div>
			<hr />
			<div className="form-error">{fields.tasks.errors}</div>
			{tasks.map((task, index) => {
				const taskFields = task.getFieldset();

				return (
					<fieldset key={task.key}>
						<div>
							<label htmlFor={taskFields.content.id}>Task #{index + 1}</label>
							<input
								id={taskFields.content.id}
								className={!taskFields.content.valid ? 'error' : ''}
								name={taskFields.content.name}
								defaultValue={taskFields.content.defaultValue}
								aria-invalid={!taskFields.content.valid || undefined}
								aria-describedby={taskFields.content.ariaDescribedBy}
							/>
							<div id={taskFields.content.errorId}>
								{taskFields.content.errors}
							</div>
						</div>
						<div>
							<label htmlFor={taskFields.completed.id}>Completed</label>
							<input
								id={taskFields.completed.id}
								type="checkbox"
								name={taskFields.completed.name}
								defaultChecked={taskFields.completed.defaultChecked}
							/>
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
				onClick={() => intent.insert({ name: fields.tasks.name })}
			>
				Add task
			</button>
			<hr />
			<button disabled={!dirty}>Save</button>
			<button type="button" onClick={() => intent.reset()}>
				Reset
			</button>
			<button
				type="button"
				onClick={() => intent.reset({ defaultValue: null })}
			>
				Clear
			</button>
		</form>
	);
}
