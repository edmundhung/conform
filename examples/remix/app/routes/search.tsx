import { getFieldElements } from '@conform-to/dom';
import { useForm, useFieldset, conform } from '@conform-to/react';
import { styles } from '~/helpers';

interface State {
	keyword?: string;
	category: string;
}

export default function SearchForm() {
	const formProps = useForm({
		/**
		 * Optional - Decide when the error should be reported initially
		 * Default to ['onSubmit'].
		 */
		initialReport: 'onBlur',

		/**
		 * Optional - Disable validation if set to [true]
		 * Default to [false]
		 */
		noValidate: false,

		/**
		 * Optional - Submit handler
		 * Triggered only when the form is valid or if noValidate is set to [true]
		 * Fallbacks to native form submission
		 */
		onSubmit(e) {
			e.preventDefault();

			const formData = new FormData(e.currentTarget);
			const payload = Object.fromEntries(formData);

			console.log('Submitted', payload);
		},
	});
	const [fieldsetProps, { keyword, category }] = useFieldset<State>({
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
	});

	return (
		<form {...formProps}>
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
