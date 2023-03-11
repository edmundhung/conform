import { conform, useFieldList, useForm, list } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const schema = z.object({
	items: z
		.string()
		.min(1, 'The field is required')
		.regex(/^[^0-9]+$/, 'Number is not allowed')
		.array()
		.min(1, 'At least one item is required')
		.max(2, 'Maximum 2 items are allowed'),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	return json(submission);
}

export default function SimpleList() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData();
	const [form, { items }] = useForm({
		lastSubmission,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});
	const itemsList = useFieldList(form.ref, items);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Simple list" lastSubmission={lastSubmission}>
				<Alert errors={items.errors} />
				<ol>
					{itemsList.map((item, index) => (
						<li key={item.key} className="border rounded-md p-4 mb-4">
							<Field label={`Item #${index + 1}`} config={item}>
								<input {...conform.input(item, { type: 'text' })} />
							</Field>
							<div className="flex flex-row gap-2">
								<button
									className="rounded-md border p-2 hover:border-black"
									{...list.remove(items.name, { index })}
								>
									Delete
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...list.reorder(items.name, { from: index, to: 0 })}
								>
									Move to top
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...list.replace(items.name, {
										index,
										defaultValue: '',
									})}
								>
									Clear
								</button>
							</div>
						</li>
					))}
				</ol>
				<div className="flex flex-row gap-2">
					<button
						className="rounded-md border p-2 hover:border-black"
						{...list.prepend(items.name, { defaultValue: '' })}
					>
						Insert top
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...list.append(items.name, { defaultValue: '' })}
					>
						Insert bottom
					</button>
				</div>
			</Playground>
		</Form>
	);
}
