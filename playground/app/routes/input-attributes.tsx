import { type SubmissionResult } from '@conform-to/dom';
import { conform, useForm } from '@conform-to/react';
import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field, Alert } from '~/components';

interface Schema {
	title: string;
	description: string;
	rating: number;
	images: File[];
	tags: string[];
	released: boolean;
	languages: string[];
}

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return json({
		enableDescription: url.searchParams.get('enableDescription') === 'yes',
	});
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const initialValue: Record<string, string | string[]> = {};
	const error: Record<string, string[]> = {};
	const validated: Record<string, boolean> = {};

	for (const name of [
		'title',
		'description',
		'rating',
		'images',
		'tags',
		'released',
		'languages',
	]) {
		const values = formData.getAll(name);

		validated[name] = true;
		error[name] = ['invalid'];

		for (const next of values) {
			const prev = initialValue[name];

			if (typeof next === 'string') {
				if (typeof prev === 'undefined') {
					initialValue[name] = next;
				} else {
					initialValue[name] = Array.isArray(prev)
						? [...prev, next]
						: [prev, next];
				}
			}
		}
	}

	return json<SubmissionResult>({
		status: 'error',
		initialValue,
		error: {
			...error,
			'': ['invalid'],
			released: ['invalid'],
		},
		state: {
			validated,
			key: {},
		},
	});
}

export default function Example() {
	const { enableDescription } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const { form, fields } = useForm<Schema>({
		id: 'test',
		lastResult,
		constraint: {
			title: {
				required: true,
				minLength: 1,
				maxLength: 200,
				pattern: '[0-9a-zA-Z ]{1,200}',
			},
			description: {
				required: true,
				minLength: 20,
				maxLength: 1000,
			},
			rating: {
				required: true,
				min: 0.5,
				max: 5,
				step: 0.5,
			},
			images: {
				required: true,
				multiple: true,
			},
			tags: {
				required: true,
				multiple: true,
			},
			released: {
				required: true,
			},
			languages: {
				required: true,
			},
		},
	});

	return (
		<Form method="post" encType="multipart/form-data" {...conform.form(form)}>
			<Playground title="Input attributes" lastSubmission={lastResult}>
				<Alert id={form.errorId} errors={form.errors} />
				<Field label="Title" config={fields.title}>
					<input
						{...conform.input(fields.title, {
							type: 'text',
							description: enableDescription,
						})}
					/>
				</Field>
				<Field label="Description" config={fields.description}>
					<textarea
						{...conform.textarea(fields.description, {
							description: enableDescription,
						})}
					/>
				</Field>
				<Field label="Image" config={fields.images}>
					<input
						{...conform.input(fields.images, {
							type: 'file',
							description: enableDescription,
						})}
					/>
				</Field>
				<Field label="Tags" config={fields.tags}>
					<select
						{...conform.select(fields.tags, {
							description: enableDescription,
						})}
					>
						<option value="">Please select</option>
						<option value="action">Action</option>
						<option value="adventure">Adventure</option>
						<option value="comedy">Comedy</option>
						<option value="fantasy">Fantasy</option>
						<option value="sci-fi">Science Fiction</option>
						<option value="horror">Horror</option>
						<option value="romance">Romance</option>
					</select>
				</Field>
				<Field label="Rating" config={fields.rating}>
					<input
						{...conform.input(fields.rating, {
							type: 'number',
							description: enableDescription,
						})}
					/>
				</Field>
				<Field label="Released" config={fields.released}>
					{conform
						.collection(fields.released, {
							type: 'radio',
							options: ['yes', 'no'],
							ariaAttributes: true,
							description: enableDescription,
						})
						.map((props) => (
							<label key={props.value} className="inline-block">
								<input {...props} />
								<span className="p-2">
									{`${props.value?.slice(0, 1).toUpperCase()}${props.value
										?.slice(1)
										.toLowerCase()}`}
								</span>
							</label>
						))}
				</Field>
				<Field label="Languages" config={fields.languages}>
					{conform
						.collection(fields.languages, {
							type: 'checkbox',
							options: ['en', 'de', 'jp'],
							ariaAttributes: true,
							description: enableDescription,
						})
						.map((props) => (
							<label key={props.value} className="inline-block">
								<input {...props} />
								<span className="p-2">{props.value?.toUpperCase()}</span>
							</label>
						))}
				</Field>
			</Playground>
		</Form>
	);
}
