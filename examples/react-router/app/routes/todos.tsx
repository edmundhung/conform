import {
	parseSubmission,
	report,
	isDirty,
	useForm,
	useFormData,
} from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v3/future';
import { Form } from 'react-router';
import { z } from 'zod';
import { createInMemoryStore } from '~/store';
import type { Route } from './+types/todos';

const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean().default(false),
});

const todosSchema = z.object({
	title: z.string(),
	tasks: z.array(taskSchema).nonempty(),
});

const schema = coerceFormValue(todosSchema);
const todos = createInMemoryStore<z.infer<typeof schema>>();

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const id = url.searchParams.get('id') ?? undefined;

	return {
		id,
		todos: await todos.getValue(id),
	};
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const id = formData.get('id')?.toString() || undefined;
	const submission = parseSubmission(formData);
	const result = schema.safeParse(submission.payload);

	if (!result.success) {
		return {
			result: report(submission, {
				error: {
					issues: result.error.issues,
				},
			}),
		};
	}

	await todos.setValue(result.data, id);

	return {
		result: report(submission, {
			reset: true,
			value: result.data,
		}),
	};
}

export default function Example({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { form, fields, intent } = useForm(schema, {
		lastResult: actionData?.result,
		defaultValue: loaderData.todos,
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
		<Form {...form.props} method="post">
			{loaderData.id ? (
				<input type="hidden" name="id" value={loaderData.id} />
			) : null}
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
								className={!taskFields.completed.valid ? 'error' : ''}
								name={taskFields.completed.name}
								defaultChecked={taskFields.completed.defaultChecked}
								aria-invalid={!taskFields.completed.valid || undefined}
								aria-describedby={taskFields.completed.ariaDescribedBy}
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
			<button type="button" onClick={() => intent.update({ value: null })}>
				Update
			</button>
			<button type="button" onClick={() => intent.reset()}>
				Reset
			</button>
			<button
				type="button"
				onClick={() => intent.reset({ defaultValue: null })}
			>
				Clear
			</button>
		</Form>
	);
}
