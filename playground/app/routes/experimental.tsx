import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { cz, flattenErrors } from '~/conform-zod';
import { Form, useActionData } from '@remix-run/react';
import { useRef, useEffect } from 'react';
import {
	createNameBuilder,
	createDictionary,
	getKey,
	getErrors,
	getListKeys,
	getInput,
	form,
	configure,
	getDefaultValue,
} from '~/conform-dom';
import { getFormData, useFormState } from '~/conform-react';
import { flushSync } from 'react-dom';

const schema = cz(
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
	const submission = form.getSubmission(formData);
	const result = schema.safeParse(submission.value);

	if (!result.success || submission.intent) {
		const error = flattenErrors(result, submission.fields);

		return form.report(submission, {
			formErrors: error.formErrors,
			fieldErrors: error.fieldErrors,
		});
	}

	return form.report(submission, {
		formErrors: ['Server error'],
	});
}

export default function Example() {
	const result = useActionData<typeof action>();
	const [state, update] = useFormState(form, {
		result,
		defaultValue: {
			title: 'Example',
			content: 'Hello world!',
		},
	});
	const formRef = useRef<HTMLFormElement>(null);
	const fields = createNameBuilder<z.input<typeof schema>>();
	const defaultValue = getDefaultValue(state);
	const errors = getErrors(state);
	const listKeys = createDictionary((name) => getListKeys(name, state));

	useEffect(() => {
		// To configure all form fields based on the current state
		return configure(formRef.current, (name) => ({
			key: getKey(name, state),
			defaultValue: defaultValue.getAll(name) ?? '',
		}));
	}, [state, defaultValue]);

	return (
		<Form
			id="example"
			method="post"
			ref={formRef}
			onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
				const formData = getFormData(event);
				const submission = form.getSubmission(formData);
				const result = schema.safeParse(submission.value);

				if (!result.success || submission.intent !== null) {
					event.preventDefault();
				}

				flushSync(() => {
					update(
						form.report(submission, flattenErrors(result, submission.fields)),
					);
				});
			}}
			onInput={(event: React.FormEvent<HTMLElement>) => {
				const input = getInput(event.target, formRef.current);

				if (!input || !state.touched.includes(input.name)) {
					return;
				}

				form.dispatch(formRef.current, {
					type: 'validate',
					payload: { name: input.name },
				});
			}}
			onBlur={(event: React.FocusEvent<HTMLElement>) => {
				const input = getInput(event.target, formRef.current);

				if (!input || state.touched.includes(input.name)) {
					return;
				}

				form.dispatch(formRef.current, {
					type: 'validate',
					payload: { name: input.name },
				});
			}}
		>
			<div>{errors[fields.$name]}</div>
			<div>
				Title
				<input
					name={fields.title.$name}
					defaultValue={defaultValue.get(fields.title.$name) ?? ''}
				/>
				<div>{errors[fields.title.$name]}</div>
			</div>
			<div>
				Content
				<textarea
					name={fields.content.$name}
					defaultValue={defaultValue.get(fields.content.$name) ?? ''}
				/>
				<div>Content Error: {errors[fields.content.$name]}</div>
			</div>
			<div>Tasks error: {errors[fields.tasks.$name]}</div>
			{listKeys[fields.tasks.$name]?.map((key, index) => (
				<fieldset key={key}>
					<input
						name={fields.tasks(index).title.$name}
						defaultValue={
							defaultValue.get(fields.tasks(index).title.$name) ?? ''
						}
					/>
					<div>{errors[fields.tasks(index).title.$name]}</div>
					<input
						type="checkbox"
						name={fields.tasks(index).done.$name}
						defaultChecked={
							defaultValue.get(fields.tasks(index).done.$name) === 'on'
						}
					/>
					<div>{errors[fields.tasks(index).done.$name]}</div>
					<div>
						<button
							name={form.control}
							value={form.serialize({
								type: 'remove',
								payload: {
									name: fields.tasks.$name,
									index,
								},
							})}
						>
							Remove
						</button>
					</div>
					<div>
						<button
							name={form.control}
							value={form.serialize({
								type: 'reorder',
								payload: {
									name: fields.tasks.$name,
									from: index,
									to: 0,
								},
							})}
						>
							Move to top
						</button>
					</div>
				</fieldset>
			))}
			<div>
				<button
					name={form.control}
					value={form.serialize({
						type: 'insert',
						payload: {
							name: fields.tasks.$name,
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
					name={form.control}
					value={form.serialize({
						type: 'update',
						payload: { name: fields.title.$name, value: 'Test' },
					})}
				>
					Update title
				</button>
			</div>
			<div>
				<button
					name={form.control}
					value={form.serialize({
						type: 'reset',
					})}
				>
					Reset form
				</button>
			</div>
		</Form>
	);
}
