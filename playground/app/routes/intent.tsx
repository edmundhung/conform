import {
	useForm,
	intent,
	getFormProps,
	getInputProps,
	getTextareaProps,
	getControlButtonProps,
	FormStateInput,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	name: z.string({ required_error: 'Name is required' }),
	message: z.string({ required_error: 'Message is required' }),
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

export default function Intent() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData();
	const { meta, fields } = useForm({
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...getFormProps(meta)}>
			<FormStateInput context={meta.context} />
			<Playground title="Intent" result={lastResult}>
				<Field label="Name" config={fields.name}>
					<input {...getInputProps(fields.name, { type: 'text' })} />
				</Field>
				<Field label="Message" config={fields.message}>
					<textarea {...getTextareaProps(fields.message)} />
				</Field>
				<div className="flex flex-col gap-2">
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.validate(fields.name.name),
						)}
					>
						Validate Name
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.validate(fields.message.name),
						)}
					>
						Validate Message
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.replace({
								name: fields.message.name,
								value: 'Hello World',
							}),
						)}
					>
						Update message
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.replace({
								name: fields.message.name,
								value: '',
								validated: true,
							}),
						)}
					>
						Clear message
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.reset({ name: fields.message.name }),
						)}
					>
						Reset message
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(meta.id, intent.reset())}
					>
						Reset form
					</button>
				</div>
			</Playground>
		</Form>
	);
}
