import {
	type Schema,
	useForm,
	useFieldset,
	createValidate,
	conform,
} from '@conform-to/react';
import { useSearchParams } from 'react-router-dom';
import { styles } from '~/helpers';

/**
 * Define the schema of the fieldset manually
 */
interface Search {
	keyword?: string;
	category: string;
}

export default function SearchForm() {
	const [searchParams, setSearchParams] = useSearchParams();
	const formProps = useForm({
		/**
		 * Decide when the error should be reported initially.
		 * The options are `onSubmit`, `onBlur` or `onChange`.
		 * Default to `onSubmit`
		 */
		initialReport: 'onBlur',

		/**
		 * Native browser report will be enabled before hydation
		 * if this is set to `true`. Default to `false`.
		 */
		fallbackNative: true,

		/**
		 * The form could be submitted regardless of the validity
		 * of the form if this is set to `true`. Default to
		 * `false`.
		 */
		noValidate: false,

		validate: createValidate((field) => {
			switch (field.name) {
				case 'keyword': {
					if (field.validity.tooShort) {
						// Native constraint (minLength) with custom message
						field.setCustomValidity('Please fill in at least 4 characters');
					} else if (field.value === 'something') {
						// Custom constraint
						field.setCustomValidity('Be a little more specific please');
					} else {
						// Reset the custom error state of the field (Important!)
						field.setCustomValidity('');
					}
					break;
				}
				case 'category': {
					// Here we didn't call setCustomValidity for category
					// So it fallbacks to native validation message
					// These messages varies based on browser vendors
					break;
				}
			}
		}),

		/**
		 * Form submit handler
		 *
		 * It will NOT be called if
		 * (1) one of the fields is invalid, and
		 * (2) noValidate is set to false
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
	const { keyword, category } = useFieldset(formProps.ref, {
		constraint: {
			keyword: {
				minLength: 4,
			},
			category: {
				required: true,
			},
		},
		defaultValue: {
			keyword: searchParams.get('keyword') ?? '',
			category: searchParams.get('category') ?? '',
		},
	});

	return (
		<form {...formProps}>
			<header className={styles.header}>
				<h1>Search Form</h1>
				{Array.from(searchParams.keys()).length > 0 ? (
					<pre className={styles.result}>
						{JSON.stringify(Object.fromEntries(searchParams), null, 2)}
					</pre>
				) : null}
			</header>
			<fieldset className={styles.card}>
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
