import {
	FormStateInput,
	conform,
	useFieldList,
	useForm,
	intent,
} from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const schema = z.object({
	items: z
		.string({ required_error: 'The field is required' })
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
	const submission = parse(formData, { schema });

	if (!submission.value) {
		return json(submission.reject());
	}

	return json(submission.accept());
}

export default function SimpleList() {
	const { hasDefaultValue, noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData();
	const { form, context, fields } = useForm({
		lastResult,
		defaultValue: hasDefaultValue
			? { items: ['default item 0', 'default item 1'] }
			: undefined,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});
	const items = useFieldList({
		formId: form.id,
		name: fields.items.name,
		context,
	});

	return (
		<Form method="post" {...conform.form(form)}>
			<FormStateInput context={context} />
			<Playground title="Simple list" lastSubmission={lastResult}>
				<Alert errors={fields.items.errors} />
				<ol>
					{items.map((item, index) => (
						<li key={item.key} className="border rounded-md p-4 mb-4">
							<Field label={`Item #${index + 1}`} config={item}>
								<input {...conform.input(item, { type: 'text' })} />
							</Field>
							<div className="flex flex-row gap-2">
								<button
									className="rounded-md border p-2 hover:border-black"
									{...intent.list.remove(fields.items, {
										index,
									})}
								>
									Delete
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...intent.list.reorder(fields.items, {
										from: index,
										to: 0,
									})}
								>
									Move to top
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...intent.list.replace(fields.items, {
										index,
										defaultValue: '',
									})}
								>
									Clear
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...intent.reset(item)}
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
						{...intent.list.insert(fields.items, {
							defaultValue: 'Top item',
							index: 0,
						})}
					>
						Insert top
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...intent.list.insert(fields.items, {
							defaultValue: '',
						})}
					>
						Insert bottom
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...intent.reset({
							formId: form.id,
							name: fields.items.name,
						})}
					>
						Reset
					</button>
				</div>
			</Playground>
		</Form>
	);
}
