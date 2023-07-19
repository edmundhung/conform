import { conform, useForm, report } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	name: z.string({ required_error: 'Name is required' }),
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

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, { name }] = useForm({
		lastSubmission,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Template Form" lastSubmission={lastSubmission}>
				<Field label="Name" config={name}>
					<input {...conform.input(name, { type: 'text' })} />
				</Field>
			</Playground>
		</Form>
	);
}
