import { useSearchParams } from '@remix-run/react';
import { styles } from '~/helpers';
import { Form, useFieldset, f } from 'remix-form-validity';

const fieldset = {
	keyword: f.search().required().minLength(3),
	category: f.select().required(),
};

export default function SearchForm() {
	const [searchParams] = useSearchParams();
	const [field, error] = useFieldset(fieldset);

	const keyword = searchParams.get('keyword');
	const categories = searchParams.getAll('category');

	return (
		<>
			<main className="p-8">
				<div className="mb-4">Current search criteria</div>
				<div className="text-gray-600">
					keyword: {keyword ? keyword : 'n/a'}
				</div>
				<div className="text-gray-600">
					category: {categories.length > 0 ? categories.join(', ') : 'n/a'}
				</div>
			</main>
			<Form className={styles.form}>
				<label className="block">
					<span className={styles.label}>Keyword</span>
					<input
						className={error.keyword ? styles.inputWithError : styles.input}
						{...field.keyword}
					/>
					<p className={styles.errorMessage}>{error.keyword}</p>
				</label>
				<label className="block">
					<span className={styles.label}>Category</span>
					<select
						className={error.category ? styles.inputWithError : styles.input}
						{...field.category}
					>
						<option value="">Please select</option>
						<option value="book">Book</option>
						<option value="food">Food</option>
						<option value="movie">Movie</option>
						<option value="music">Music</option>
					</select>
					<p className={styles.errorMessage}>{error.category}</p>
				</label>
				<button type="submit" className={styles.buttonPrimary}>
					Search
				</button>
			</Form>
		</>
	);
}
