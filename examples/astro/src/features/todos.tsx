import {
	isDirty,
	parseSubmission,
	report,
	useForm,
	useFormData,
	type SubmissionResult,
} from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v3/future';
import { z } from 'zod';

type TodosValue = z.infer<typeof todosSchema>;

type TodosFormProps = {
	action: string;
	id?: string;
	defaultValue: TodosValue | null;
	lastResult?: SubmissionResult | null;
};

const taskSchema = z.object({
	content: z.string(),
	completed: z.boolean().default(false),
});

const todosSchema = coerceFormValue(
	z.object({
		title: z.string(),
		tasks: z.array(taskSchema).nonempty(),
	}),
);

function createInMemoryStore<Type>() {
	const stores: Record<string, Type | null> = {};

	return {
		async getValue(id?: string) {
			await new Promise((resolve) => {
				setTimeout(resolve, Math.random() * 150);
			});

			return stores[id ?? ''] ?? null;
		},
		async setValue(value: Type, id?: string) {
			await new Promise((resolve) => {
				setTimeout(resolve, Math.random() * 1000);
			});

			stores[id ?? ''] = value;
		},
	};
}

const todosStore = createInMemoryStore<TodosValue>();

export async function getTodos(id?: string) {
	return todosStore.getValue(id);
}

export async function submitTodos(formData: FormData) {
	const id = formData.get('id')?.toString() || undefined;
	const submission = parseSubmission(formData);
	const result = todosSchema.safeParse(submission.payload);

	if (!result.success) {
		return {
			success: false as const,
			result: report(submission, {
				error: {
					issues: result.error.issues,
				},
			}),
		};
	}

	await todosStore.setValue(result.data, id);

	return {
		success: true as const,
		result: report(submission, {
			reset: true,
			value: result.data,
		}),
	};
}

export function TodosForm({
	action,
	id,
	defaultValue,
	lastResult,
}: TodosFormProps) {
	const { form, fields, intent } = useForm(todosSchema, {
		lastResult,
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
		<form {...form.props} method="post" action={action}>
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
