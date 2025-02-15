import type { ActionFunctionArgs } from '@remix-run/node';
import {
	Form,
	useActionData,
	useLoaderData,
	useNavigation,
} from '@remix-run/react';
import { parseSubmission, report, useFormData, isDirty } from 'conform-react';
import { coerceZodFormData, resolveZodResult } from 'conform-zod';
import { z } from 'zod';
import { useForm } from '../template';
import { createInMemoryStore } from '../store';

const taskSchema = coerceZodFormData(
	z.object({
		content: z.string(),
		completed: z.boolean().default(false),
	}),
);

const todosSchema = coerceZodFormData(
	z.object({
		title: z.string(),
		tasks: z.array(taskSchema).nonempty(),
	}),
);

const todos = createInMemoryStore<z.infer<typeof todosSchema>>();

export async function loader() {
	return {
		todos: await todos.getValue(),
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData);
	const result = todosSchema.safeParse(submission.value);

	if (!result.success) {
		return {
			result: report(submission, {
				error: resolveZodResult(result),
			}),
		};
	}

	await todos.setValue(result.data);

	return {
		result: report<z.input<typeof todosSchema>>(submission, {
			reset: true,
		}),
	};
}

export default function Example() {
	const loaderData = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigation = useNavigation();
	const { form, fields, intent } = useForm({
		// If we reset the form after a successful submission, we need to
		// keep in mind that the default value (loader) will be updated
		// only after the submsionn result (action) is received. We need to
		// delay when useForm receives last submission result to avoid
		// resetting the form too early.
		lastResult: navigation.state === 'idle' ? actionData?.result : null,
		defaultValue: loaderData.todos,
		onValidate(value) {
			return resolveZodResult(todosSchema.safeParse(value));
		},
	});
	const dirty = useFormData(form.props.ref, (formData) =>
		isDirty(formData, {
			defaultValue: loaderData.todos,
		}),
	);
	const tasks = fields.tasks.getFieldList();

	return (
		<Form {...form.props} method="post">
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
		</Form>
	);
}
