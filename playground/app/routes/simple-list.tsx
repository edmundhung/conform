import {
	FormStateInput,
	useForm,
	getFormProps,
	getInputProps,
	FormProvider,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
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

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);

	return {
		hasDefaultValue: url.searchParams.get('hasDefaultValue') === 'yes',
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, {
		schema,
	});

	return json(submission.reply());
}

export default function SimpleList() {
	const { hasDefaultValue, noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
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
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				<FormStateInput formId={form.id} />
				<Playground title="Simple list" result={lastResult}>
					<Alert errors={fields.items.errors} />
					<ol>
						{items.map((task, index) => (
							<li key={task.key} className="border rounded-md p-4 mb-4">
								<Field label={`Item #${index + 1}`} meta={task}>
									<input {...getInputProps(task, { type: 'text' })} />
								</Field>
								<div className="flex flex-row gap-2">
									<button
										className="rounded-md border p-2 hover:border-black"
										{...form.remove.getButtonProps({
											name: fields.items.name,
											index,
										})}
									>
										Delete
									</button>
									<button
										className="rounded-md border p-2 hover:border-black"
										{...form.reorder.getButtonProps({
											name: fields.items.name,
											from: index,
											to: 0,
										})}
									>
										Move to top
									</button>
									<button
										className="rounded-md border p-2 hover:border-black"
										{...form.update.getButtonProps({
											name: fields.items.name,
											index,
											value: '',
											validated: false,
										})}
									>
										Clear
									</button>
									<button
										className="rounded-md border p-2 hover:border-black"
										{...form.reset.getButtonProps({
											name: fields.items.name,
											index,
										})}
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
							{...form.insert.getButtonProps({
								name: fields.items.name,
								defaultValue: 'Top item',
								index: 0,
							})}
						>
							Insert top
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.insert.getButtonProps({
								name: fields.items.name,
								defaultValue: '',
							})}
						>
							Insert bottom
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.reset.getButtonProps({
								name: fields.items.name,
							})}
						>
							Reset
						</button>
					</div>
				</Playground>
			</Form>
		</FormProvider>
	);
}
