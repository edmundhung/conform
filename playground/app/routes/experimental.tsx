import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import {
	useInputControl,
	useFormData,
	getFormData,
	useFormState,
} from '~/conform-react';
import { coerceZodFormData, flattenZodErrors } from '~/conform-zod';
import { Form, useActionData } from '@remix-run/react';
import {
	type FormControlIntent,
	combineFormControls,
	listControl,
	resetControl,
	updateControl,
	validateControl,
	deserializeIntent,
	getFormMetadata,
	getFieldset,
	report,
	resolve,
	isInput,
	getFieldMetadata,
} from '~/conform-dom';
import { flushSync } from 'react-dom';
import { useRef } from 'react';

const schema = coerceZodFormData(
	z.object({
		title: z.string().min(3).max(20),
		content: z.string().nonempty(),
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

export const intentName = '__intent__';

export const control = combineFormControls([
	validateControl,
	resetControl,
	updateControl,
	listControl,
]);

export type Intent = FormControlIntent<typeof control>;

export function parseSubmission(formData: FormData | URLSearchParams) {
	return resolve(formData, {
		intentName,
		parseIntent(value) {
			const intent = deserializeIntent(value);

			if (control.isValid(intent)) {
				return intent;
			}

			return null;
		},
		updateValue(value, intent) {
			return control.updateValue(value, intent);
		},
	});
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData);
	const result = schema.safeParse(submission.value);

	if (!result.success) {
		return report(submission, {
			error: flattenZodErrors(result, submission.fields),
		});
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
	const { state, update, intent } = useFormState({
		result,
		formRef,
		defaultValue: {
			tasks: [{ title: 'Test', done: true }],
		},
		control,
		intentName,
	});
	const form = getFormMetadata(state, {
		ref: formRef,
		onSubmit(event: React.FormEvent<HTMLFormElement>) {
			const formData = getFormData(event);
			const submission = parseSubmission(formData);
			const result = schema.safeParse(submission.value);

			if (!result.success || submission.intent) {
				event.preventDefault();
			}

			const submissionResult = report(submission, {
				error: flattenZodErrors(result, submission.fields),
			});

			flushSync(() => {
				update(submissionResult);
			});
		},
		onInput(event: React.FormEvent<HTMLFormElement>) {
			if (
				isInput(event.target, formRef.current) &&
				state.touchedFields.includes(event.target.name)
			) {
				intent.submit({
					type: 'validate',
					payload: {
						name: event.target.name,
					},
				});
			}
		},
		onBlur(event: React.FocusEvent<HTMLFormElement>) {
			if (
				isInput(event.target, formRef.current) &&
				!state.touchedFields.includes(event.target.name)
			) {
				intent.submit({
					type: 'validate',
					payload: {
						name: event.target.name,
					},
				});
			}
		},
	});
	const fields = getFieldset(state, {
		metadata(state, name) {
			return getFieldMetadata(state, name);
		},
	});
	const title = useFormData('example', (formData) =>
		formData.get(fields.title.name)?.toString(),
	);
	const taskFields = fields.tasks.getFieldList();
	const titleControl = useInputControl(fields.title.defaultValue);

	return (
		<Form id="example" method="post" {...form.props}>
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
								name={intent.name}
								value={intent.serialize({
									type: 'remove',
									payload: {
										name: fields.tasks.name,
										index,
									},
								})}
							>
								Remove
							</button>
						</div>
						<div>
							<button
								name={intent.name}
								value={intent.serialize({
									type: 'reorder',
									payload: {
										name: fields.tasks.name,
										from: index,
										to: 0,
									},
								})}
							>
								Move to top
							</button>
						</div>
					</fieldset>
				);
			})}
			<div>
				<button
					name={intent.name}
					value={intent.serialize({
						type: 'insert',
						payload: {
							name: fields.tasks.name,
							defaultValue: { title: 'Example', done: true },
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
					name={intent.name}
					value={intent.serialize({
						type: 'update',
						payload: { name: fields.title.name, value: 'Test' },
					})}
				>
					Update title
				</button>
			</div>
			<div>
				<button>Submit</button>
			</div>
			<div>
				<button
					name={intent.name}
					value={intent.serialize({
						type: 'reset',
					})}
				>
					Reset form
				</button>
			</div>
		</Form>
	);
}
