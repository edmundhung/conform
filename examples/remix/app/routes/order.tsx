import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { FieldsetOptions } from 'remix-form-validity';
import {
	Form,
	useFieldset,
	useMultipleFieldset,
	f,
	parse,
} from 'remix-form-validity';
import { cookie } from '~/cookie.server';
import { styles } from '~/helpers';

const fieldset = {
	products: f.fieldset(),
	address: f.text().required('Address is required'),
	remarks: f.textarea(),
};

export let loader: LoaderFunction = async ({ request }) => {
	const data = await cookie.parse(request.headers.get('Cookie'));

	return json(data, {
		headers: {
			'Set-Cookie': await cookie.serialize({}),
		},
	});
};

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const { value, error } = parse(formData, (value) => {
		return {
			...fieldset,
			products: Array(value?.products.length ?? 1).fill(productFieldset),
		};
	});

	if (formData.has('add-item') || formData.has('remove-item')) {
		const products = [...(value.products ?? [])];
		const productIndex = formData.get('remove-item');

		if (productIndex) {
			products.splice(Number(productIndex), 1);
		} else {
			products.push({});
		}

		return redirect('/order', {
			headers: {
				'Set-Cookie': await cookie.serialize({
					value: { ...value, products },
					error: null,
				}),
			},
		});
	} else if (error) {
		return redirect('/order', {
			headers: {
				'Set-Cookie': await cookie.serialize({ value, error }),
			},
		});
	}

	return redirect(`/order`, {
		headers: {
			'Set-Cookie': await cookie.serialize({ success: true, value, error }),
		},
	});
};

export default function OrderForm() {
	const { success, value, error } = useLoaderData() ?? {};
	const count = value?.products?.length;
	const [field, errorMessage] = useFieldset(fieldset, { value, error });
	const [products, handleAdd, handleDelete] = useMultipleFieldset(
		field.products,
		count ?? 1,
	);

	return (
		<>
			<main className="p-8">
				{success ? (
					<>
						<div className="mb-4 text-emerald-500">Order success</div>
						{value?.products?.map((product, i) => (
							<div key={i} className="text-gray-600">{`Product #${i + 1} - ${
								product.item
							} x${product.quantity}`}</div>
						)) ?? null}
						<div className="text-gray-600">
							Address: {value?.address ? value.address : 'n/a'}
						</div>
						<div className="text-gray-600">
							Remarks: {value?.remarks ? value.remarks : 'n/a'}
						</div>
					</>
				) : (
					<div className="mb-4">Wanna order something?</div>
				)}
			</main>
			<Form
				method="post"
				className={`flex flex-col-reverse ${styles.form}`}
				noValidate
			>
				<button type="submit" className={styles.buttonPrimary}>
					Order now
				</button>
				<div className="space-y-4">
					<div className="space-y-2">
						{products.map((product, index) => (
							<div className="flex items-end gap-4" key={product.key}>
								<div className="flex-1">
									<ProductFieldset
										label={`Product #${index + 1}`}
										{...product.options}
									/>
								</div>
								<button
									type="submit"
									className={styles.buttonWarning}
									name="remove-item"
									value={index}
									onClick={handleDelete}
									disabled={products.length === 1}
									formNoValidate
								>
									⨯
								</button>
							</div>
						))}
					</div>
					<button
						className={styles.buttonSecondary}
						type="submit"
						name="add-item"
						value="1"
						onClick={handleAdd}
						disabled={products.length === 3}
						formNoValidate
					>
						Add Product
					</button>
					<label className="block">
						<span className={styles.label}>Address</span>
						<input
							className={
								errorMessage.address ? styles.inputWithError : styles.input
							}
							{...field.address}
						/>
						<p className={styles.errorMessage}>{errorMessage.address}</p>
					</label>
					<label className="block">
						<span className={styles.label}>Remarks</span>
						<textarea
							className={
								errorMessage.remarks ? styles.inputWithError : styles.input
							}
							{...field.remarks}
						/>
						<p className={styles.errorMessage}>{errorMessage.remarks}</p>
					</label>
				</div>
			</Form>
		</>
	);
}

const productFieldset = {
	item: f.text().required('Product name is required'),
	quantity: f.number('Invalid').required('Required').min(1, 'Min. 1'),
};

interface ProductFieldsetProps extends FieldsetOptions {
	label: string;
}

function ProductFieldset({ label, ...options }: ProductFieldsetProps) {
	const [field, errorMessage] = useFieldset(productFieldset, options);

	return (
		<fieldset className="flex gap-4" name="product">
			<label className="block flex-1">
				<span className={styles.label}>{label}</span>
				<input
					className={errorMessage.item ? styles.inputWithError : styles.input}
					{...field.item}
				/>
			</label>
			<label className="block w-16">
				<span className={styles.label}>Quantity</span>
				<input
					className={
						errorMessage.quantity ? styles.inputWithError : styles.input
					}
					{...field.quantity}
				/>
			</label>
		</fieldset>
	);
}
