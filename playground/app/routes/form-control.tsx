import {
	useForm,
	getFormProps,
	getInputProps,
	getTextareaProps,
	FormStateInput,
	FormProvider,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	name: z.string({ required_error: 'Name is required' }),
	message: z.string({ required_error: 'Message is required' }),
	number: z.number({ required_error: 'Number is required' }),
});

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json(submission.reply());
}

export default function FormControl() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	return (
		<FormProvider context={form.context}>
			<Form method="post" {...getFormProps(form)}>
				<FormStateInput formId={form.id} />
				<Playground title="Form Control" result={lastResult}>
					<input name="hidden" defaultValue="hidden-value" />
					<Field label="Name" meta={fields.name}>
						<input {...getInputProps(fields.name, { type: 'text' })} />
					</Field>
					<Field label="Message" meta={fields.message}>
						<textarea {...getTextareaProps(fields.message)} />
					</Field>
					<Field label="Number" meta={fields.number}>
						<input {...getInputProps(fields.number, { type: 'number' })} />
					</Field>
					<div className="flex flex-col gap-2">
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.validate.getButtonProps()}
						>
							Validate Form
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.validate.getButtonProps({
								name: fields.message.name,
							})}
						>
							Validate Message
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.update.getButtonProps({
								name: fields.message.name,
								value: 'Hello World',
							})}
						>
							Update message
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.update.getButtonProps({
								value: {
									number: 13579,
									name: 'Conform',
									message:
										'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
								},
							})}
						>
							Update form
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.update.getButtonProps({
								name: fields.number.name,
								value: 123,
							})}
						>
							Update number
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							type="button"
							onClick={() => {
								// We should wrap each form.update() in flushSync ideally
								// But this is not well documented, so people are likely doing this as "it looks working"
								// This makes sure we are not breaking the existing code
								form.update({
									name: fields.message.name,
									value: 'Updated message',
								});
								form.update({
									name: fields.number.name,
									value: 987,
								});
							}}
						>
							Multiple updates
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.update.getButtonProps({
								name: fields.message.name,
								value: '',
								validated: true,
							})}
						>
							Clear message
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.reset.getButtonProps({
								name: fields.message.name,
							})}
						>
							Reset message
						</button>
						<button
							className="rounded-md border p-2 hover:border-black"
							{...form.reset.getButtonProps()}
						>
							Reset form
						</button>
					</div>
				</Playground>
			</Form>
		</FormProvider>
	);
}
