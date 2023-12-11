import {
	FormStateInput,
	useForm,
	intent,
	getFormProps,
	getInputProps,
	getControlButtonProps,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const schema = z.object({
	items: z
		.string({ required_error: 'The field is required' })
		.min(2, 'At least 2 characters are required')
		.regex(/^[^0-9]+$/, 'Number is not allowed')
		.array()
		.min(1, 'At least one item is required')
		.max(2, 'Maximum 2 items are allowed'),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		hasDefaultValue: url.searchParams.get('hasDefaultValue') === 'yes',
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, {
		schema,
	});

	if (!submission.value) {
		return json(submission.reject());
	}

	return json(submission.accept());
}

export default function SimpleList() {
	const { hasDefaultValue, noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const { meta, fields } = useForm({
		lastResult,
		defaultValue: hasDefaultValue
			? { items: ['default item 0', 'default item 1'] }
			: undefined,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});
	const items = fields.items.getFieldList();

	return (
		<Form method="post" {...getFormProps(meta)}>
			<FormStateInput context={meta.context} />
			<Playground title="Simple list" lastSubmission={lastResult}>
				<Alert errors={fields.items.errors} />
				<ol>
					{items.map((task, index) => (
						<li key={task.key} className="border rounded-md p-4 mb-4">
							<Field label={`Item #${index + 1}`} config={task}>
								<input {...getInputProps(task, { type: 'text' })} />
							</Field>
							<div className="flex flex-row gap-2">
								<button
									className="rounded-md border p-2 hover:border-black"
									{...getControlButtonProps(
										meta.id,
										intent.remove({ name: fields.items.name, index }),
									)}
								>
									Delete
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...getControlButtonProps(
										meta.id,
										intent.reorder({
											name: fields.items.name,
											from: index,
											to: 0,
										}),
									)}
								>
									Move to top
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...getControlButtonProps(
										meta.id,
										intent.replace({ name: task.name, value: '' }),
									)}
								>
									Clear
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...getControlButtonProps(
										meta.id,
										intent.reset({ name: task.name }),
									)}
								>
									Reset
								</button>
							</div>
						</li>
					))}
				</ol>
				<div className="flex flex-row gap-2">
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.insert({
								name: fields.items.name,
								defaultValue: 'Top item',
								index: 0,
							}),
						)}
					>
						Insert top
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.insert({ name: fields.items.name, defaultValue: '' }),
						)}
					>
						Insert bottom
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.reset({ name: fields.items.name }),
						)}
					>
						Reset
					</button>
				</div>
			</Playground>
		</Form>
	);
}
