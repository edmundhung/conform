import { conform, parse, useForm } from '@conform-to/react';
import { type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useId } from 'react';
import { Playground, Field } from '~/components';

interface Schema {
	answers: string[];
}

function parseForm(formData: FormData) {
	return parse<Schema>(formData, {
		resolve({ answers }) {
			const error: Partial<Record<keyof Schema, string>> = {};

			if (!answers?.length) {
				error.answers = 'Required';
			}

			if (error.answers) {
				return { error };
			}

			return {
				value: {
					answers,
				},
			};
		},
	});
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
	const id = useId();
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, { answers }] = useForm<Schema>({
		id,
		defaultValue: {
			answers: [],
		},
		lastSubmission,
		onValidate: !noClientValidate
			? ({ formData }) => parseForm(formData)
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Attributes" lastSubmission={lastSubmission}>
				<Field label="Multiple Choice" config={answers}>
					<label>
						<input
							{...conform.input(answers, {
								type: 'checkbox',
								value: 'a',
								id: `${id}-answers-a`,
							})}
						/>
						<span className="p-2">A</span>
					</label>
					<label className="inline-block">
						<input
							{...conform.input(answers, {
								type: 'checkbox',
								value: 'b',
								id: `${id}-answers-b`,
							})}
						/>
						<span className="p-2">B</span>
					</label>
					<label className="inline-block">
						<input
							{...conform.input(answers, {
								type: 'checkbox',
								value: 'c',
								id: `${id}-answers-c`,
							})}
						/>
						<span className="p-2">C</span>
					</label>
					<label className="inline-block">
						<input
							{...conform.input(answers, {
								type: 'checkbox',
								value: 'd',
								id: `${id}-answers-d`,
							})}
						/>
						<span className="p-2">D</span>
					</label>
				</Field>
			</Playground>
		</Form>
	);
}
