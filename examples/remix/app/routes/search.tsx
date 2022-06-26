import { useSearchParams, Form } from '@remix-run/react';
import { styles } from '~/helpers';
import { useForm, useFieldset, f } from '@conform-to/react';

export default function SearchForm() {
	const [searchParams] = useSearchParams();
	const formProps = useForm({
		initialReport: 'onBlur',
	});
	const [setup, error] = useFieldset<{
		keyword: string;
		category: string;
	}>({
		constraint: {
			keyword: {
				required: true,
				minLength: 3,
			},
			category: {
				required: true,
			},
		},
	});

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
			<Form className={styles.form} {...formProps}>
				<fieldset {...setup}>
					<label className="block">
						<div className={styles.label}>Keyword</div>
						<input
							className={error.keyword ? styles.inputWithError : styles.input}
							{...f.input(setup.field.keyword)}
						/>
						<p className={styles.errorMessage}>{error.keyword}</p>
					</label>
					<label className="block">
						<div className={styles.label}>Category</div>
						<select
							className={error.category ? styles.inputWithError : styles.input}
							{...f.select(setup.field.category)}
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
				</fieldset>
			</Form>
		</>
	);
}
