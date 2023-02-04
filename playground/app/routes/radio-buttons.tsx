import { conform, parse, useForm } from '@conform-to/react';
import { type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';

interface Schema {
	answer: string;
}

function parseForm(formData: FormData) {
	const submission = parse(formData);

	if (!submission.value.answer) {
		submission.error.push(['answer', 'Required']);
	}

	return submission;
}

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseForm(formData);

	return json(submission);
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const state = useActionData<typeof action>();
	const [form, { answer }] = useForm<Schema>({
		state,
		onValidate: !noClientValidate
			? ({ formData }) => parseForm(formData)
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Attributes" state={state}>
				<Field label="Multiple Choice" {...answer}>
					<label>
						<input
							{...conform.input(answer.config, { type: 'radio', value: 'a' })}
						/>
						<span className="p-2">A</span>
					</label>
					<label className="inline-block">
						<input
							{...conform.input(answer.config, { type: 'radio', value: 'b' })}
						/>
						<span className="p-2">B</span>
					</label>
					<label className="inline-block">
						<input
							{...conform.input(answer.config, { type: 'radio', value: 'c' })}
						/>
						<span className="p-2">C</span>
					</label>
					<label className="inline-block">
						<input
							{...conform.input(answer.config, { type: 'radio', value: 'd' })}
						/>
						<span className="p-2">D</span>
					</label>
				</Field>
			</Playground>
		</Form>
	);
}
