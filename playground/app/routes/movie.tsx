import { conform, isFieldElement, parse, useForm } from '@conform-to/react';
import { type ActionArgs, type LoaderArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

interface Movie {
	title: string;
	description?: string;
	genre: string;
	rating?: number;
}

export async function loader({ request }: LoaderArgs) {
	return parseConfig(request);
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, {
		resolve({ title, description, genre, rating }) {
			const error: Record<string, string> = {};

			if (!title) {
				error.title = 'Title is required';
			} else if (!title.match(/[0-9a-zA-Z ]{1,20}/)) {
				error.title = 'Please enter a valid title';
			}

			if (description && description.length < 30) {
				error.description = 'Please provides more details';
			}

			if (genre === '') {
				error.genre = 'Genre is required';
			}

			if (rating && Number(rating) % 0.5 !== 0) {
				error.rating = 'The provided rating is invalid';
			}

			if (error.title || error.description || error.genre || error.rating) {
				return { error };
			}

			return {
				value: {
					title,
					description,
					genre,
					rating,
				},
			};
		},
	});

	return json(submission);
}

export default function MovieForm() {
	const config = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, { title, description, genre, rating }] = useForm<Movie>({
		...config,
		lastSubmission,
		constraint: {
			title: {
				required: true,
				pattern: '[0-9a-zA-Z ]{1,20}',
			},
			description: {
				minLength: 30,
				maxLength: 200,
			},
			genre: {
				required: true,
				/**
				 * No value from multiple select will be included in the FormData
				 * when nothing is selected. This makes it hard to know the field
				 * exist and add it to part of the scope. As native select is
				 * uncommon (especially with `multiple`) due to lack of customization
				 * capablity. This is considered a limitation for now.
				 */
				// multiple: true,
			},
			rating: {
				min: '0.5',
				max: '5',
				step: '0.5',
			},
		},
		onValidate: config.validate
			? ({ form, formData }) => {
					const submission = parse(formData, {
						resolve({ title, description, genre, rating }) {
							const error: Record<string, string> = {};

							for (const element of form.elements) {
								if (!isFieldElement(element)) {
									continue;
								}

								switch (element.name) {
									case 'title':
										if (element.validity.valueMissing) {
											error[element.name] = 'Title is required';
										} else if (element.validity.patternMismatch) {
											error[element.name] = 'Please enter a valid title';
										}
										break;
									case 'description':
										if (element.validity.tooShort) {
											error[element.name] = 'Please provides more details';
										}
										break;
									case 'genre':
										if (element.validity.valueMissing) {
											error[element.name] = 'Genre is required';
										}
										break;
									case 'rating':
										if (element.validity.stepMismatch) {
											error[element.name] = 'The provided rating is invalid';
										}
										break;
								}
							}

							if (
								error.title ||
								error.description ||
								error.genre ||
								error.rating
							) {
								return { error };
							}

							return {
								value: {
									title,
									description,
									genre,
									rating,
								},
							};
						},
					});

					return submission;
			  }
			: undefined,
		shouldRevalidate: 'onInput',
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Movie Form" lastSubmission={lastSubmission}>
				<fieldset>
					<Field label="Title" config={title}>
						<input {...conform.input(title, { type: 'text' })} />
					</Field>
					<Field label="Description" config={description}>
						<textarea {...conform.textarea(description)} />
					</Field>
					<Field label="Genre" config={genre}>
						<select {...conform.select(genre)}>
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
					<Field label="Rating" config={rating}>
						<input {...conform.input(rating, { type: 'number' })} />
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
