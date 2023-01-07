import {
	conform,
	parse,
	useFieldList,
	useForm,
	list,
} from '@conform-to/react';
import { formatError, validate } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const schema = z.object({
	items: z
		.array(
			z
				.string()
				.min(1, 'The field is required')
				.regex(/^[^0-9]+$/, 'Number is not allowed'),
		)
		.min(1, 'At least one item is required')
		.max(5, 'Only five items are allowed in maximum'),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData);

	try {
		switch (submission.type) {
			case 'validate':
			case 'submit':
				schema.parse(submission.value);
				break;
		}
	} catch (error) {
		submission.error.push(...formatError(error));
	}

	return json(submission);
}

export default function SimpleList() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const state = useActionData();
	const [form, { items }] = useForm<z.infer<typeof schema>>({
		mode: noClientValidate ? 'server-validation' : 'client-only',
		state,
		onValidate: !noClientValidate
			? ({ formData }) => validate(formData, schema)
			: undefined,
	});
	const itemsList = useFieldList(form.ref, items.config);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Simple list" state={state}>
				<Alert message={form.error} />
				<ol>
					{itemsList.map((item, index) => (
						<li key={item.key} className="border rounded-md p-4 mb-4">
							<Field label={`Item #${index + 1}`} {...item}>
								<input {...conform.input(item.config, { type: 'text' })} />
							</Field>
							<div className="flex flex-row gap-2">
								<button
									className="rounded-md border p-2 hover:border-black"
									{...list.remove(items.config.name, { index })}
								>
									Delete
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...list.reorder(items.config.name, { from: index, to: 0 })}
								>
									Move to top
								</button>
								<button
									className="rounded-md border p-2 hover:border-black"
									{...list.replace(items.config.name, {
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
						{...list.prepend(items.config.name, { defaultValue: '' })}
					>
						Insert top
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...list.append(items.config.name, { defaultValue: '' })}
					>
						Insert bottom
					</button>
				</div>
			</Playground>
		</Form>
	);
}
