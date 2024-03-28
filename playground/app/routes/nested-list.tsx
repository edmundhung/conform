import {
	getFormProps,
	getInputProps,
	useForm,
	FormProvider,
	FormStateInput,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	items: z
		.object({
			options: z.string().array().min(1),
		})
		.array(),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json(submission.reply());
}

export default function App() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData();
	const [form, fields] = useForm({
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});
	const items = fields.items.getFieldList();

	return (
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				<FormStateInput formId={form.id} />
				<Playground title="Nested list" result={lastResult}>
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-y-6">
							{items.map((item) => {
								const fieldset = item.getFieldset();
								const options = fieldset.options.getFieldList();

								return (
									<div key={item.key}>
										<div className="mt-4">
											Options
											{options.map((option, index) => (
												<div
													key={option.key}
													className="flex flex-nowrap gap-2"
												>
													<Field label={`Option #${index + 1}`} meta={option}>
														<input
															{...getInputProps(option, { type: 'text' })}
														/>
													</Field>
													<button
														{...form.remove.getButtonProps({
															name: fieldset.options.name,
															index,
														})}
													>
														Delete option
													</button>
													<button
														{...form.updateAt.getButtonProps({
															name: fieldset.options.name,
															index,
															value: 'Updated value',
														})}
													>
														Update value
													</button>
												</div>
											))}
										</div>
										<button
											{...form.insert.getButtonProps({
												name: fieldset.options.name,
											})}
										>
											Add option
										</button>
									</div>
								);
							})}
							<button
								{...form.insert.getButtonProps({
									name: fields.items.name,
									defaultValue: {
										options: [''],
									},
								})}
							>
								Add item
							</button>
						</div>
					</div>
				</Playground>
			</Form>
		</FormProvider>
	);
}
