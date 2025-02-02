import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { coerceZodFormData, resolveZodResult, memorize } from 'conform-zod';
import { Form, useActionData } from '@remix-run/react';
import {
	useCustomInput,
	useFormData,
	useForm,
	getMetadata,
	parseSubmission,
	isInput,
	report,
	baseControl,
	applyIntent,
} from 'conform-react';
import { useMemo, useRef } from 'react';

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

const control = baseControl.extend<
	{
		status: 'success' | 'error' | null;
	},
	{
		type: 'randomize';
	}
>({
	onInitializeState(state) {
		return {
			...state,
			custom: {
				status: null,
			},
		};
	},
	onUpdateState(state, { result }) {
		return {
			...state,
			custom: {
				...state.custom,
				status:
					result.error === undefined
						? state.custom.status
						: result.error
							? 'error'
							: 'success',
			},
		};
	},
	onParseIntent(intent) {
		if (intent.type === 'randomize') {
			return {
				type: 'update',
				payload: {
					value: {
						content: Math.floor(Date.now() * Math.random()).toString(36),
						tasks: [
							{
								title: Math.floor(Date.now() * Math.random()).toString(36),
								done: Math.random() > 0.5 ? 'on' : '',
							},
						],
					},
				},
			};
		}
	},
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData, {
		intentName: 'intent',
	});
	const [intent, value] = applyIntent(submission, {
		control,
	});
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
			formError: ['Something went wrong'],
		},
	});
}

export default function Example() {
	const lastResult = useActionData<typeof action>();
	const formRef = useRef<HTMLFormElement>(null);
	const schema = useMemo(() => {
		const isTitleUnique = memorize(async (title: string) => {
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
		control,
		lastResult,
		intentName: 'intent',
		async onValidate(value) {
			return resolveZodResult(await schema.safeParseAsync(value));
		},
		async onSubmit(event, { submission, formData, update }) {
			event.preventDefault();

			const response = await fetch(
				'/experimental?_data=routes%2Fexperimental&custom',
				{
					method: 'POST',
					body: formData,
				},
			);
			const result = await response.json();

			update(
				report(submission, {
					error: result.error,
				}),
			);
		},
	});
	const { form, fields } = getMetadata(state, {
		defaultValue: {
			title: 'Example',
			content: 'Hello World!',
			tasks: [{ title: 'Test', done: true }],
		},
	});
	const title = useFormData(formRef, (formData) =>
		formData.get(fields.title.name)?.toString(),
	);
	const taskFields = fields.tasks.getFieldList();
	const titleControl = useCustomInput(fields.title.defaultValue);

	return (
		<Form
			method="post"
			ref={formRef}
			onSubmit={handleSubmit}
			onInput={(event) => {
				if (
					isInput(event.target) &&
					state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
			onBlur={(event) => {
				if (
					isInput(event.target) &&
					!state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
		>
			<div>FormError: {form.error}</div>
			<div>FormStatus: {form.status}</div>
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
						type: 'randomize',
					})}
				>
					Set random value
				</button>
			</div>

			<div>
				<button
					name="intent"
					value={control.serializeIntent({
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
