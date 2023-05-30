import { conform, useFieldList, useForm, list } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const schema = z.object({
	task: z.string(),
	pending: z.string().array().optional(),
	todos: z.string().array().optional(),
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
	const [form, { task, pending, todos }] = useForm({
		lastSubmission,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});
	console.log('rendered');
	const pendingList = useFieldList(form.ref, {
		...pending,
		defaultValue: pending.defaultValue ?? [],
	});
	const todoList = useFieldList(form.ref, {
		...todos,
		defaultValue: todos.defaultValue ?? [],
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Multiple lists" lastSubmission={lastSubmission}>
				<div className="flex flex-row items-end gap-2">
					<Field label="Task" config={task}>
						<input
							className="h-10"
							{...conform.input(task, { type: 'text' })}
							autoComplete="off"
						/>
					</Field>
					<div className="mb-4">
						<button
							className="rounded-md border p-2 my-1 h-10 hover:border-black"
							{...list.append(pending.name, { defaultValueFrom: task.name })}
						>
							Add
						</button>
					</div>
				</div>

				<Field label="Pending tasks" config={pending}>
					<div className="my-2">
						{pendingList.length === 0 ? (
							<div className="rounded flex items-center justify-center h-10 bg-gray-100 text-gray-500">
								No tasks
							</div>
						) : (
							<ol className="flex-1">
								{pendingList.map((item, index) => (
									<li key={item.key} className="border rounded-md p-4 mb-4">
										<input {...conform.input(item, { hidden: true })} />
										<Field label={`Pending #${index + 1}`}>
											{item.defaultValue}
										</Field>
										<div className="flex flex-row gap-2">
											<button
												className="rounded-md border p-2 hover:border-black"
												{...list.combine(
													list.append(todos.name, {
														defaultValueFrom: item.name,
													}),
													list.remove(pending.name, { index }),
												)}
											>
												Priortize
											</button>
											{index > 0 ? (
												<button
													className="rounded-md border p-2 hover:border-black"
													{...list.reorder(pending.name, {
														from: index,
														to: 0,
													})}
												>
													Move to top
												</button>
											) : null}
										</div>
									</li>
								))}
							</ol>
						)}
					</div>
				</Field>

				<Field label="Urgent tasks" config={todos}>
					<div className="my-2">
						{todoList.length === 0 ? (
							<div className="rounded flex items-center justify-center h-10 bg-gray-100 text-gray-500">
								No tasks
							</div>
						) : (
							<ol className="flex-1">
								{todoList.map((item, index) => (
									<li key={item.key} className="border rounded-md p-4 mb-4">
										<input {...conform.input(item, { hidden: true })} />
										<Field label={`Todo #${index + 1}`}>
											{item.defaultValue}
										</Field>
										<div className="flex flex-row gap-2">
											<button
												className="rounded-md border p-2 hover:border-black"
												{...list.remove(todos.name, { index })}
											>
												Complete
											</button>
											<button
												className="rounded-md border p-2 hover:border-black"
												{...list.combine(
													list.prepend(pending.name, {
														defaultValueFrom: item.name,
													}),
													list.remove(todos.name, { index }),
												)}
											>
												Depriortize
											</button>
										</div>
									</li>
								))}
							</ol>
						)}
					</div>
				</Field>
			</Playground>
		</Form>
	);
}
