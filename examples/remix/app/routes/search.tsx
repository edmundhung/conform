import {
	type Schema,
	useForm,
	useFieldset,
	conform,
	getFieldElements,
} from '@conform-to/react';
import { useSearchParams } from 'react-router-dom';
import { styles } from '~/helpers';

/**
 * Define the schema of the fieldset manually
 */
const schema: Schema<{
	keyword?: string;
	category: string;
}> = {
	/**
	 * Required - Define the fields and coresponding constraint
	 * All keys will be used as the name of the field
	 */
	fields: {
		keyword: {
			minLength: 4,
		},
		category: {
			required: true,
		},
	},

	/**
	 * Optional - Customise validation behaviour
	 * Fallbacks to native validation message provided by the browser vendors
	 */
	validate(element) {
		const [keyword] = getFieldElements(element, 'keyword');

		if (keyword.validity.tooShort) {
			// Native constraint (minLength) with custom message
			keyword.setCustomValidity('Please fill in at least 4 characters');
		} else if (keyword.value === 'something') {
			// Custom constraint
			keyword.setCustomValidity('Be a little more specific please');
		} else {
			// Reset the custom error state of the field (Important!)
			keyword.setCustomValidity('');
		}

		// Here we didn't call setCustomValidity for category
		// So it fallbacks to native validation message
		// These messages varies based on browser vendors
	},
};

export default function SearchForm() {
	const [searchParams, setSearchParams] = useSearchParams();
	const formProps = useForm({
		/**
		 * Decide when the error should be reported initially.
		 * Default to `onSubmit`
		 */
		initialReport: 'onBlur',

		/**
		 * Native browser report will be used before hydation if it is set to `true`.
		 * Default to `false`
		 */
		fallbackNative: true,

		/**
		 * The form could be submitted even if there is invalid input control if it is set to `true`.
		 * Default to `false`
		 */
		noValidate: false,

		/**
		 * The submit handler will be triggered only when the form is valid.
		 * Or when noValidate is set to `true`
		 */
		onSubmit(e) {
			e.preventDefault();

			const formData = new FormData(e.currentTarget);
			const query = new URLSearchParams();

			for (const [key, value] of formData) {
				query.set(key, value.toString());
			}

			setSearchParams(query);
		},
	});
	const [fieldsetProps, { keyword, category }] = useFieldset(schema, {
		initialValue: {
			keyword: searchParams.get('keyword') ?? '',
			category: searchParams.get('category') ?? '',
		},
	});

	return (
		<form {...formProps}>
			<main className="p-8">
				<div className="mb-4">Search Form</div>
				{Array.from(searchParams.keys()).length > 0 ? (
					<pre>{JSON.stringify(Object.fromEntries(searchParams), null, 2)}</pre>
				) : null}
			</main>
			<fieldset className={styles.form} {...fieldsetProps}>
				<label className="block">
					<div className={styles.label}>Keyword</div>
					<input
						className={keyword.error ? styles.invalidInput : styles.input}
						{...conform.input(keyword)}
					/>
					<p className={styles.errorMessage}>{keyword.error}</p>
				</label>
				<label className="block">
					<div className={styles.label}>Category</div>
					<select
						className={category.error ? styles.invalidInput : styles.input}
						{...conform.select(category)}
					>
						<option value="">Please select</option>
						<option value="book">Book</option>
						<option value="food">Food</option>
						<option value="movie">Movie</option>
						<option value="music">Music</option>
					</select>
					<p className={styles.errorMessage}>{category.error}</p>
				</label>
				<button type="submit" className={styles.buttonPrimary}>
					Search
				</button>
			</fieldset>
		</form>
	);
}
