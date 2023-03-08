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

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
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
};

export default function MovieForm() {
	const config = useLoaderData();
	const state = useActionData();
	const [form, { title, description, genre, rating }] = useForm<Movie>({
		...config,
		state,
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
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Movie Form" state={state}>
				<fieldset>
					<Field label="Title" {...title}>
						<input {...conform.input(title.config, { type: 'text' })} />
					</Field>
					<Field label="Description" {...description}>
						<textarea {...conform.textarea(description.config)} />
					</Field>
					<Field label="Genre" {...genre}>
						<select {...conform.select(genre.config)}>
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
					<Field label="Rating" {...rating}>
						<input {...conform.input(rating.config, { type: 'number' })} />
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
