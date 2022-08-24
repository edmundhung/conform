import { type FieldsetConstraint, createValidate } from '@conform-to/react';
import {
	type Movie,
	type LoginForm,
	type Checklist,
	type Task,
	MovieFieldset,
	LoginFieldset,
	ChecklistFieldset,
} from '~/fieldset';
import { action, Form, Playground } from '~/playground';

export { action };

export default function Basic() {
	const movieConstraint: FieldsetConstraint<Movie> = {
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
	};
	const movieValidate = createValidate((field) => {
		switch (field.name) {
			case 'title':
				if (field.validity.valueMissing) {
					field.setCustomValidity('Title is required');
				} else if (field.validity.patternMismatch) {
					field.setCustomValidity('Please enter a valid title');
				} else {
					field.setCustomValidity('');
				}
				break;
			case 'description':
				if (field.validity.tooShort) {
					field.setCustomValidity('Please provides more details');
				} else {
					field.setCustomValidity('');
				}
				break;
			case 'genres':
				if (field.validity.valueMissing) {
					field.setCustomValidity('Genre is required');
				} else {
					field.setCustomValidity('');
				}
				break;
			case 'rating':
				if (field.validity.stepMismatch) {
					field.setCustomValidity('The provided rating is invalid');
				} else {
					field.setCustomValidity('');
				}
				break;
		}
	});
	const loginConstraint: FieldsetConstraint<LoginForm> = {
		email: {
			required: true,
		},
		password: {
			required: true,
			minLength: 8,
		},
	};
	const checklistConstraint: FieldsetConstraint<Checklist> = {
		title: {
			required: true,
		},
		tasks: {
			required: true,
		},
	};
	const taskConstraint: FieldsetConstraint<Task> = {
		content: {
			required: true,
		},
		completed: {},
	};

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Reporting error messages provided by the browser vendor"
				form="native"
			>
				<Form id="native" method="post">
					<MovieFieldset constraint={movieConstraint} />
				</Form>
			</Playground>
			<Playground
				title="Custom Constraint"
				description="Setting up custom validation rules with user-defined error messages"
				form="custom"
			>
				<Form id="custom" method="post" validate={movieValidate}>
					<MovieFieldset constraint={movieConstraint} />
				</Form>
			</Playground>
			<Playground
				title="Skip Validation"
				description="Disabling validation by using the `noValidate` option"
				form="disable"
			>
				<Form id="disable" method="post" noValidate>
					<LoginFieldset constraint={loginConstraint} />
				</Form>
			</Playground>
			<Playground
				title="Reporting on submit"
				description="No error would be reported before users try submitting the form"
				form="onsubmit"
			>
				<Form id="onsubmit" method="post" initialReport="onSubmit">
					<LoginFieldset constraint={loginConstraint} />
				</Form>
			</Playground>
			<Playground
				title="Reporting on change"
				description="Error would be reported once the users type something on the field"
				form="onchange"
			>
				<Form id="onchange" method="post" initialReport="onChange">
					<LoginFieldset constraint={loginConstraint} />
				</Form>
			</Playground>
			<Playground
				title="Reporting on blur"
				description="Error would not be reported until the users leave the field"
				form="onblur"
			>
				<Form id="onblur" method="post" initialReport="onBlur">
					<LoginFieldset constraint={loginConstraint} />
				</Form>
			</Playground>
			<Playground
				title="Remote form"
				description="Connecting the form and fieldset using the `form` attribute"
				form="remote"
			>
				<Form id="remote" method="post" />
				<LoginFieldset form="remote" constraint={loginConstraint} />
			</Playground>
			<Playground
				title="Nested list"
				description="Constructing a nested array using useFieldList"
				form="nested-list"
			>
				<Form id="nested-list" method="post">
					<ChecklistFieldset
						constraint={checklistConstraint}
						taskConstraint={taskConstraint}
					/>
				</Form>
			</Playground>
		</>
	);
}
