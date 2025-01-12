import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { useInputControl, useFormData, useForm } from '~/conform-react';
import { coerceZodFormData, resolveZodResult } from '~/conform-zod';
import { Form, useActionData } from '@remix-run/react';
import {
	getFormMetadata,
	getFieldset,
	parseSubmission,
	isInput,
	report,
	// createFormControl,
	// FormControlIntent,
	memoize,
	applyIntent,
	defaultFormControl,
} from '~/conform-dom';
import { useMemo, useRef } from 'react';

function createSchema(constraint: {
	isTitleUnique: (title: string) => Promise<boolean>;
}) {
	return coerceZodFormData(
		z.object({
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
			tasks: z
				.array(
					z.object({
						title: z.string().nonempty(),
						done: z.boolean(),
					}),
				)
				.min(1)
				.max(3),
		}),
	);
}

// const control = createFormControl<
// 	| FormControlIntent<typeof defaultFormControl>
// 	| { type: 'test'; payload: string },
// 	{ status: 'success' | 'error' | null }
// >(() => {
// 	return {
// 		...defaultFormControl,
// 		parseIntent(intent) {
// 			if (intent.type === 'test' && typeof intent.payload === 'string') {
// 				return {
// 					type: 'test',
// 					payload: intent.payload,
// 				};
// 			}

// 			return defaultFormControl.parseIntent(intent);
// 		},
// 		initializeState(options) {
// 			return {
// 				...defaultFormControl.initializeState(options),
// 				status: null,
// 			};
// 		},
// 		updateState(state, { type, result, reset }) {
// 			return {
// 				...defaultFormControl.updateState(state, {
// 					type,
// 					result,
// 					reset,
// 				}),
// 				status:
// 					result.error === undefined
// 						? state.status
// 						: result.intent
// 							? null
// 							: result.error
// 								? 'error'
// 								: 'success',
// 			};
// 		},
// 	};
// });

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = applyIntent(
		parseSubmission(formData, {
			intentName: 'intent',
		}),
	);
	const schema = createSchema({
		isTitleUnique(title) {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(title === 'Test');
				}, 1000);
			});
		},
	});
	const result = await schema.safeParseAsync(submission.value);

	if (!result.success || submission.intent) {
		return report(submission, resolveZodResult(result));
	}

	return report<typeof submission, z.input<typeof schema>>(submission, {
		error: {
			formError: ['Something went wrong'],
		},
	});
}

export default function Example() {
	const result = useActionData<typeof action>();
	const formRef = useRef<HTMLFormElement>(null);
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
	const { state, handleSubmit, intent } = useForm(formRef, {
		result,
		intentName: 'intent',
		defaultValue: {
			title: 'Example',
			content: 'Hello World!',
			tasks: [{ title: 'Test', done: true }],
		},
		async onValidate(value) {
			const result = await schema.safeParseAsync(value);

			return resolveZodResult(result);
		},
		async onSubmit(event, { submission, formData }) {
			event.preventDefault();

			const response = await fetch(
				'/experimental?_data=routes%2Fexperimental&custom',
				{
					method: 'POST',
					body: formData,
				},
			);
			const result = await response.json();

			return report(submission, {
				error: result.error,
			});
		},
	});
	const form = getFormMetadata(state);
	const fields = getFieldset(state);
	const title = useFormData(formRef, (formData) =>
		formData.get(fields.title.name)?.toString(),
	);
	const taskFields = fields.tasks.getFieldList();
	const titleControl = useInputControl(fields.title.defaultValue);

	return (
		<Form
			method="post"
			ref={formRef}
			onSubmit={handleSubmit}
			onInput={(event) => {
				if (
					isInput(event.target, formRef.current) &&
					state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
			onBlur={(event) => {
				if (
					isInput(event.target, formRef.current) &&
					!state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
		>
			<div>{form.error}</div>
			<div>
				Title
				<input
					ref={titleControl.register}
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
				/>
				<div>Control: {titleControl.value}</div>
				<div>FormData: {title}</div>
				<div>{fields.title.error}</div>
			</div>
			<div>
				Content
				<textarea
					name={fields.content.name}
					defaultValue={fields.content.defaultValue}
				/>
				<div>Content Error: {fields.content.error}</div>
			</div>
			<div>Tasks error: {fields.tasks.error}</div>
			{taskFields.map((taskField, index) => {
				const task = taskField.getFieldset();
				return (
					<fieldset key={taskField.key}>
						<input
							name={task.title.name}
							defaultValue={task.title.defaultValue}
						/>
						<div>{task.title.error}</div>
						<input
							type="checkbox"
							name={task.done.name}
							defaultChecked={task.done.defaultValue === 'on'}
						/>
						<div>{task.done.error}</div>
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
					value={defaultFormControl.serializeIntent({
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
					value={defaultFormControl.serializeIntent({
						type: 'update',
						payload: {
							value: {
								title: 'Update title',
								content: 'And the content',
							},
						},
					})}
				>
					Partial update
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
