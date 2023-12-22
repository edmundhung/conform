import {
	type FieldProps,
	type FormId,
	type FieldMetadata,
	type FormMetadata,
	getFormProps,
	getInputProps,
	useField,
	useForm,
	useFormMetadata,
	FormProvider,
	getTextareaProps,
	getControlButtonProps,
	intent,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { memo, useRef } from 'react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z
	.object({
		name: z.string({ required_error: 'Name is required' }),
		message: z.string({ required_error: 'Message is required' }),
	})
	.superRefine((value, ctx) => {
		if (!value.message.startsWith(`Hello ${value.name}`)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Please start with Hello ${value.name}`,
			});
		}
	});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, {
		schema,
	});

	return json(submission.reply());
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const { form, fieldset } = useForm({
		id: 'example',
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});
	const name = fieldset.name.name;
	const message = fieldset.message.name;
	const description = (
		<ul className="space-y-1 list-disc">
			<FormMetadata formId={form.id} subject="initialValue" />
			<FormMetadata formId={form.id} subject="value" />
			<FormMetadata formId={form.id} subject="key" />
			<FormMetadata formId={form.id} subject="dirty" />
			<FormMetadata formId={form.id} subject="valid" />
			<FormMetadata formId={form.id} subject="allValid" />
			<FormMetadata formId={form.id} subject="errors" />
			<FormMetadata formId={form.id} subject="allErrors" />
			<FieldMetadata formId={form.id} name={name} subject="initialValue" />
			<FieldMetadata formId={form.id} name={name} subject="value" />
			<FieldMetadata formId={form.id} name={name} subject="key" />
			<FieldMetadata formId={form.id} name={name} subject="dirty" />
			<FieldMetadata formId={form.id} name={name} subject="valid" />
			<FieldMetadata formId={form.id} name={name} subject="errors" />
			<FieldMetadata formId={form.id} name={message} subject="initialValue" />
			<FieldMetadata formId={form.id} name={message} subject="value" />
			<FieldMetadata formId={form.id} name={message} subject="key" />
			<FieldMetadata formId={form.id} name={message} subject="dirty" />
			<FieldMetadata formId={form.id} name={message} subject="valid" />
			<FieldMetadata formId={form.id} name={message} subject="errors" />
		</ul>
	);

	return (
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				<Playground title="Fine-grained Subscription" description={description}>
					<Field label="Name">
						<input {...getInputProps(fieldset.name)} />
					</Field>
					<Field label="Message">
						<textarea {...getTextareaProps(fieldset.message)} rows={6} />
					</Field>
					<div className="flex flex-row gap-2">
						<button
							className="rounded-md border p-2 hover:border-black"
							{...getControlButtonProps(
								form.id,
								intent.reset({ name: fieldset.message.name }),
							)}
						>
							Reset message
						</button>
					</div>
				</Playground>
			</Form>
		</FormProvider>
	);
}

function useRenderCount(): number {
	const ref = useRef(0);

	ref.current += 1;

	// The render count will go from 1, 3, 5, 7, ... in strict mode
	// This resolves it to 1, 2, 3, 4, ...
	return (ref.current + 1) / 2;
}

const FieldMetadata = memo(function FieldMetadata({
	formId,
	name,
	subject,
}: FieldProps<string, string[]> & {
	subject: keyof FieldMetadata<string, string[]>;
}) {
	const renderCount = useRenderCount();
	const { field } = useField({
		formId,
		name,
	});

	// eslint-disable-next-line no-console
	console.log(`${name}.${subject}: ${JSON.stringify(field[subject])}`);

	return <li>{`${name}.${subject}: ${renderCount}`}</li>;
});

const FormMetadata = memo(function FormMetadata({
	formId,
	subject,
}: {
	formId: FormId<Record<string, any>, string[]>;
	subject: keyof FormMetadata<Record<string, any>, string[]>;
}) {
	const renderCount = useRenderCount();
	const form = useFormMetadata({
		formId,
	});

	// eslint-disable-next-line no-console
	console.log(`form.${subject}: ${JSON.stringify(form[subject])}`);

	return <li>{`form.${subject}: ${renderCount}`}</li>;
});
