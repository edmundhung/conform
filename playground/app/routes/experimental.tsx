import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { coerceZodFormData, flattenZodErrors } from '~/conform-zod';
import { Form, useActionData } from '@remix-run/react';
import { useRef } from 'react';
import {
	resolve,
	report,
	getInput,
	controls,
	getFormMetadata,
	isTouched,
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

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = resolve(formData, controls);
	const result = schema.safeParse(submission.value);

	if (!result.success) {
		const error = flattenZodErrors(result, submission.fields);
		const formResult = report(submission, {
			formError: error.formError,
			fieldError: error.fieldError,
		});

		return formResult;
	}

	return report(submission, {
		formError: ['Something went wrong'],
	});
}

export default function Example() {
	const result = useActionData<typeof action>();
	const formRef = useRef<HTMLFormElement>(null);
	const [state, update] = useFormState<z.input<typeof schema>, string[], any>({
		result,
		controls,
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
				const submission = resolve(formData, controls);
				const result = schema.safeParse(submission.value);

				if (!result.success || submission.intent) {
					event.preventDefault();
				}

				const error = flattenZodErrors(result, submission.fields);
				const formResult = report(submission, {
					formError: error.formError,
					fieldError: error.fieldError,
				});

				flushSync(() => {
					update(formResult);
				});
			}}
			onInput={(event: React.FormEvent<HTMLElement>) => {
				const input = getInput(event.target, formRef.current);

				if (input && isTouched(state, input.name)) {
					controls.dispatch(formRef.current, {
						type: 'validate',
						payload: {
							name: input.name,
						},
					});
				}
			}}
			onBlur={(event: React.FocusEvent<HTMLElement>) => {
				const input = getInput(event.target, formRef.current);

				if (input && !isTouched(state, input.name)) {
					controls.dispatch(formRef.current, {
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
								name={controls.intentName}
								value={controls.serialize({
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
								name={controls.intentName}
								value={controls.serialize({
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
					name={controls.intentName}
					value={controls.serialize({
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
					name={controls.intentName}
					value={controls.serialize({
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
					name={controls.intentName}
					value={controls.serialize({
						type: 'reset',
					})}
				>
					Reset form
				</button>
			</div>
		</Form>
	);
}
