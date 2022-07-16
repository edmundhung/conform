import { type Schema, getFieldElements } from '@conform-to/react';
import { type MovieSchema, MovieFieldset } from '~/fieldset';
import { action, Form, Playground } from '~/playground';

export { action };

export default function Basic() {
	const movieSchema: Schema<MovieSchema> = {
		fields: {
			title: {
				required: true,
				pattern: '[0-9a-zA-Z ]{1,20}',
			},
			description: {
				minLength: 30,
				maxLength: 200,
			},
			genres: {
				required: true,
				multiple: true,
			},
			rating: {
				min: '0.5',
				max: '5',
				step: '0.5',
			},
		},
	};
	const movieSchemaWithCustomMessage: Schema<MovieSchema> = {
		fields: movieSchema.fields,
		validate(element) {
			const [title] = getFieldElements(element, 'title');
			const [description] = getFieldElements(element, 'description');
			const [genres] = getFieldElements(element, 'genres');
			const [rating] = getFieldElements(element, 'rating');

			if (title.validity.valueMissing) {
				title.setCustomValidity('Title is required');
			} else if (title.validity.patternMismatch) {
				title.setCustomValidity('Please enter a valid title');
			} else {
				title.setCustomValidity('');
			}

			if (description.validity.tooShort) {
				description.setCustomValidity('Please provides more details');
			} else {
				description.setCustomValidity('');
			}

			if (genres.validity.valueMissing) {
				genres.setCustomValidity('Genre is required');
			} else {
				genres.setCustomValidity('');
			}

			if (rating.validity.stepMismatch) {
				rating.setCustomValidity('The provided rating is invalid');
			} else {
				rating.setCustomValidity('');
			}
		},
	};

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Reporting error messages provided by the browser vendor"
				form="native"
			>
				<Form id="native" method="post">
					<MovieFieldset schema={movieSchema} />
				</Form>
			</Playground>
			<Playground
				title="Custom Constraint"
				description="Setting up custom validation rules with user-defined error messages"
				form="custom"
			>
				<Form id="custom" method="post">
					<MovieFieldset schema={movieSchemaWithCustomMessage} />
				</Form>
			</Playground>
		</>
	);
}
