import {
	type FieldName,
	FormProvider,
	FormStateInput,
	useField,
	useForm,
	getFormProps,
	getInputProps,
	getFieldsetProps,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const baseCategorySchema = z.object({
	name: z.string(),
});

type Category = z.infer<typeof baseCategorySchema> & {
	subcategories: Category[];
};

const categorySchema: z.ZodType<Category> = baseCategorySchema.extend({
	subcategories: z.lazy(() => categorySchema.array()),
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
		schema: categorySchema,
	});

	return json(submission.reply());
}

function CategoryField({ name }: { name: FieldName<Category> }) {
	const [field, form] = useField(name);
	const fields = field.getFieldset();
	const subcategories = fields.subcategories.getFieldList();

	return (
		<fieldset {...getFieldsetProps(field)}>
			<Alert errors={field.errors} />
			<Field label="Name" meta={fields.name}>
				<input {...getInputProps(fields.name, { type: 'text' })} />
			</Field>
			<ol>
				{subcategories.map((subcategory, index) => (
					<li key={subcategory.key} className="border rounded-md p-4 mb-4">
						<CategoryField name={subcategory.name} />
						<div className="flex flex-row gap-2">
							<button
								className="rounded-md border p-2 hover:border-black"
								{...form.remove.getButtonProps({
									name: fields.subcategories.name,
									index,
								})}
							>
								Delete
							</button>
						</div>
					</li>
				))}
			</ol>
			<div className="flex flex-row gap-2">
				<button
					className="rounded-md border p-2 hover:border-black"
					{...form.insert.getButtonProps({
						name: fields.subcategories.name,
						defaultValue: {
							name: '',
							subcategories: [null],
						},
					})}
				>
					Add
				</button>
			</div>
		</fieldset>
	);
}

export default function RecrusiveList() {
	const { hasDefaultValue, noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form] = useForm({
		lastResult,
		defaultValue: hasDefaultValue
			? {
					name: 'Root category',
					subcategories: [
						{ name: 'Subcategory 1' },
						{
							name: 'Subcategory 2',
							subcategories: [{ name: 'Subcategory 2.1' }],
						},
					],
				}
			: undefined,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema: categorySchema })
			: undefined,
	});

	return (
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				<FormStateInput formId={form.id} />
				<Playground title="Recrusive list" result={lastResult}>
					<CategoryField name={form.name} />
				</Playground>
			</Form>
		</FormProvider>
	);
}
