import { conform, useForm, validate, report } from '@conform-to/react';
import { parse } from '@conform-to/zod';
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
	const submission = parse(formData, { schema });

	return json(report(submission));
}

export default function Validate() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData();
	const [form, { name, message }] = useForm({
		lastSubmission,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Validate" lastSubmission={lastSubmission}>
				<Field label="Name" config={name}>
					<input {...conform.input(name, { type: 'text' })} />
				</Field>
				<Field label="Message" config={message}>
					<textarea {...conform.textarea(message)} />
				</Field>
				<div className="flex flex-row gap-2">
					<button
						className="rounded-md border p-2 hover:border-black"
						{...validate(name.name)}
					>
						Validate Name
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...validate(message.name)}
					>
						Validate Message
					</button>
				</div>
			</Playground>
		</Form>
	);
}
