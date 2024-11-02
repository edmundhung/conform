import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { coerceZodFormData, flattenZodErrors } from '~/conform-zod';
import { Form, useActionData } from '@remix-run/react';
import { useRef } from 'react';
import {
	type FormIntent,
	resolve,
	report,
	getInput,
	combineFormControls,
	validateControl,
	resetControl,
	updateControl,
	listControl,
	getFormMetadata,
	deserializeIntent,
} from '~/conform-dom';
import { getFormData, useFormState } from '~/conform-react';
import { flushSync } from 'react-dom';

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

const control = combineFormControls([
	validateControl,
	resetControl,
	updateControl,
	listControl,
]);

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = resolve(formData, {
		intentName: 'intent',
		parseIntent(value) {
			const intent = deserializeIntent(value);

			if (control.isValid(intent)) {
				return intent;
			}

			return null;
		},
		updateValue(submittedValue, intent) {
			return control.updateValue(submittedValue, intent);
		},
	});
	const parseResult = schema.safeParse(submission.value);

	if (!parseResult.success) {
		const error = flattenZodErrors(parseResult, submission.fields);
		const result = report(submission, {
			formError: error.formError,
			fieldError: error.fieldError,
		});

		return result;
	}

	return report(submission, {
		formError: ['Something went wrong'],
	});
}

export default function Example() {
	const result = useActionData<typeof action>();
	const formRef = useRef<HTMLFormElement>(null);
	const { state, update, intent } = useFormState<
		z.infer<typeof schema>,
		string[],
		FormIntent<typeof control>
	>({
		result,
		control,
		formRef,
	});
	const form = getFormMetadata(state);
	const fields = form.getFieldset();
	const taskFields = fields.tasks.getFieldList();

	return (
		<Form
			id="example"
			method="post"
			ref={formRef}
			onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
				const formData = getFormData(event);
				const submission = resolve(formData, {
					intentName: 'intent',
					parseIntent(value) {
						const intent = deserializeIntent(value);

						if (control.isValid(intent)) {
							return intent;
						}

						return null;
					},
					updateValue(submittedValue, intent) {
						return control.updateValue(submittedValue, intent);
					},
				});
				const parseResult = schema.safeParse(submission.value);

				if (!parseResult.success || submission.intent) {
					event.preventDefault();
				}

				const error = flattenZodErrors(parseResult, submission.fields);
				const result = report(submission, {
					formError: error.formError,
					fieldError: error.fieldError,
				});

				flushSync(() => {
					update(result);
				});
			}}
			onInput={(event: React.FormEvent<HTMLElement>) => {
				const input = getInput(event.target, formRef.current);

				if (input && state.touchedFields.includes(input.name)) {
					intent.submit({
						type: 'validate',
						payload: {
							name: input.name,
						},
					});
				}
			}}
			onBlur={(event: React.FocusEvent<HTMLElement>) => {
				const input = getInput(event.target, formRef.current);

				if (input && !state.touchedFields.includes(input.name)) {
					intent.submit({
						type: 'validate',
						payload: {
							name: input.name,
						},
					});
				}
			}}
		>
			<div>{form.error}</div>
			<div>
				Title
				<input
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
				/>
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
