import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { coerceZodFormData, resolveZodResult, memoize } from 'conform-zod';
import { Form, useActionData } from '@remix-run/react';
import {
	useInput,
	useFormData,
	useFormControl,
	useFormState,
	getMetadata,
	parseSubmission,
	isInput,
	report,
	control,
	applyIntent,
	isTouched,
} from 'conform-react';
import { useId, useMemo } from 'react';

function createSchema(constraint: {
	isTitleUnique: (title: string) => Promise<boolean>;
}) {
	const schema = z.object({
		title: z
			.string({ required_error: 'Title is required' })
			.min(4)
			.regex(
				/^[a-zA-Z0-9]+$/,
				'Invalid title: only letters or numbers are allowed',
			)
			.pipe(
				z.string().refine((title) => constraint.isTitleUnique(title), {
					message: 'Title is already used',
				}),
			),
		content: z.string(),
		file: z
			.instanceof(File)
			.optional()
			.refine((file) => {
				return !file || file.size <= 3 * 1024 * 1024;
			}, 'File size must be less than 3MB'),
		tasks: z
			.array(
				z.object({
					title: z.string().nonempty(),
					done: z.boolean(),
				}),
			)
			.min(1)
			.max(3),
	});

	return coerceZodFormData(schema);
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData, {
		intentName: 'intent',
	});
	const [intent, value] = applyIntent(submission);
	const schema = createSchema({
		isTitleUnique(title) {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(title === 'Test');
				}, 1000);
			});
		},
	});
	const result = await schema.safeParseAsync(value);

	if (!result.success || intent) {
		return report(submission, {
			error: resolveZodResult(result),
			value,
			intent,
		});
	}

	return report(submission, {
		error: {
			formErrors: ['Something went wrong'],
		},
	});
}

export default function Example() {
	const lastResult = useActionData<typeof action>();
	const formId = useId();
	const schema = useMemo(() => {
		const isTitleUnique = memoize(async (title: string) => {
			const response = await fetch('/api', {
				method: 'POST',
				body: JSON.stringify(title),
			});
			const result = await response.json();

			return result === 'Test';
		});

		return createSchema({
			isTitleUnique,
		});
	}, []);
	const [status, updateStatus] = useFormState(
		(status: 'success' | 'error' | null, { result }) => {
			if (result.intent !== null) {
				return null;
			}

			if (typeof result.error === 'undefined') {
				return status;
			}

			return result.error === null ? 'success' : 'error';
		},
		{
			initialState: null,
		},
	);
	const { state, handleSubmit, intent } = useFormControl(formId, {
		lastResult,
		intentName: 'intent',
		async onValidate(value) {
			return resolveZodResult(await schema.safeParseAsync(value));
		},
		onUpdate(action) {
			console.log(action);
			updateStatus(action);
		},
		async onSubmit(event, { formData, update }) {
			event.preventDefault();

			const response = await fetch(
				'/experimental?_data=routes%2Fexperimental&custom',
				{
					method: 'POST',
					body: formData,
				},
			);
			const result = await response.json();

			update({
				error: result.error,
			});
		},
	});
	const { form, fields } = getMetadata(state, {
		defaultValue: {
			title: 'Example',
			content: 'Hello World!',
			tasks: [{ title: 'Test', done: true }],
		},
		defineFormMetadata(metadata) {
			return Object.assign(metadata, intent, {
				get id() {
					return formId;
				},
				get errorId() {
					return `${this.id}-error`;
				},
				get props() {
					return {
						id: this.id,
						noValidate: true,
						onSubmit: handleSubmit,
						onBlur(event) {
							if (
								isInput(event.target) &&
								!isTouched(state, event.target.name)
							) {
								intent.validate(event.target.name);
							}
						},
						onInput(event) {
							if (
								isInput(event.target) &&
								isTouched(state, event.target.name)
							) {
								intent.validate(event.target.name);
							}
						},
						'aria-invalid': metadata.invalid || undefined,
						'aria-describedby': metadata.invalid ? this.errorId : undefined,
					} satisfies React.DetailedHTMLProps<
						React.FormHTMLAttributes<HTMLFormElement>,
						HTMLFormElement
					>;
				},
			});
		},
		defineFieldMetadata(name, metadata) {
			return Object.assign(metadata, {
				get id() {
					return `${formId}-${name}`;
				},
				get errorId() {
					return `${this.id}-error`;
				},
			});
		},
	});

	const title = useFormData(
		formId,
		(formData) => formData?.get(fields.title.name)?.toString() ?? '',
	);
	const taskFields = fields.tasks.getFieldList();
	const titleControl = useInput(fields.title.defaultValue);

	return (
		<Form method="post" {...form.props}>
			<div>Status: {status}</div>
			<div>formErrors: {form.errors}</div>
			<div>
				Title
				<input
					ref={titleControl.register}
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
				/>
				<div>Control: {titleControl.value}</div>
				<div>FormData: {title}</div>
				<div>{fields.title.errors}</div>
			</div>
			<div>
				Content
				<textarea
					name={fields.content.name}
					defaultValue={fields.content.defaultValue}
				/>
				<div>Content Error: {fields.content.errors}</div>
			</div>
			<div>Tasks error: {fields.tasks.errors}</div>
			{taskFields.map((taskField, index) => {
				const task = taskField.getFieldset();
				return (
					<fieldset key={taskField.key}>
						<input
							name={task.title.name}
							defaultValue={task.title.defaultValue}
						/>
						<div>{task.title.errors}</div>
						<input
							type="checkbox"
							name={task.done.name}
							defaultChecked={task.done.defaultValue === 'on'}
						/>
						<div>{task.done.errors}</div>
						<div>
							<button
								type="button"
								onClick={() => {
									intent.remove({
										name: fields.tasks.name,
										index,
									});
								}}
							>
								Remove
							</button>
						</div>
						<div>
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
						</div>
					</fieldset>
				);
			})}
			<div>
				<button
					name="intent"
					value={control.serializeIntent({
						type: 'insert',
						payload: {
							name: fields.tasks.name,
							defaultValue: { title: 'Example' },
						},
					})}
				>
					Insert task
				</button>
			</div>
			<div>
				<button>Submit</button>
			</div>
			<div>
				<button
					type="button"
					onClick={() => {
						intent.update({
							name: fields.title.name,
							value: 'Test',
						});
					}}
				>
					Update title
				</button>
			</div>
			<div>
				<button
					name="intent"
					value={control.serializeIntent({
						type: 'update',
						payload: {
							value: {
								content: 'Test',
								tasks: [
									{ title: 'First', done: true },
									{ title: 'Second', done: false },
								],
							},
						},
					})}
				>
					Update form value
				</button>
			</div>
			<div>
				<button
					type="button"
					onClick={() => {
						intent.update({
							name: fields.title.name,
							value: 'Update title in one intent',
						});
						intent.update({
							name: fields.content.name,
							value: 'Update content in another intent',
						});
					}}
				>
					Multiple updates
				</button>
			</div>
			<div>
				<button>Submit</button>
			</div>
			<div>
				<button
					type="button"
					onClick={() => {
						intent.reset();
					}}
				>
					Reset form
				</button>
			</div>
		</Form>
	);
}
