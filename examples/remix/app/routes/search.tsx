import { useSearchParams } from '@remix-run/react';
import { styles } from '~/helpers';
import { Form, useFieldset } from 'remix-form-validity';
import { f, createFieldset } from '@form-validity/schema';

const fieldset = createFieldset({
	keyword: f.input('search').required().minLength(3),
	category: f.select().required(),
});

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
					<div className={styles.label}>Keyword</div>
					<input
						className={error.keyword ? styles.inputWithError : styles.input}
						{...field.keyword}
					/>
					<p className={styles.errorMessage}>{error.keyword}</p>
				</label>
				<label className="block">
					<div className={styles.label}>Category</div>
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
