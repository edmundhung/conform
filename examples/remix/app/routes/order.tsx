import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useMemo } from 'react';
import type { FieldsetOptions } from 'remix-form-validity';
import {
	Form,
	useFieldset,
	useFieldsetControl,
	f,
	parse,
} from 'remix-form-validity';
import { cookie } from '~/cookie.server';
import { styles } from '~/helpers';

function configureFieldset(productCount?: number) {
	return {
		products: f.fieldset(productFieldset, productCount ?? 1),
		address: f.input('text').required('Address is required'),
		delivery: f
			.input('radio', ['standard', 'express'])
			.required('Please select a delivery method'),
		remarks: f.textarea(),
	};
}

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
	const { value, error, isDraft } = parse(formData, (value) => {
		const fieldset = configureFieldset();

		return {
			...fieldset,
			products: Array(value?.products.length ?? 1).fill(productFieldset),
		};
	});

	if (error || isDraft) {
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
	const fieldset = useMemo(() => configureFieldset(count), [count]);
	const [field, errorMessage] = useFieldset(fieldset, { value, error });
	const [products, addProductButton] = useFieldsetControl(field.products);

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
									className={styles.buttonWarning}
									disabled={products.length === 1}
									{...product.deleteButton}
								>
									⨯
								</button>
							</div>
						))}
					</div>
					<button
						className={styles.buttonSecondary}
						disabled={products.length === 3}
						{...addProductButton}
					>
						Add Product
					</button>
					<label className="block">
						<div className={styles.label}>Address</div>
						<input
							className={
								errorMessage.address ? styles.inputWithError : styles.input
							}
							{...field.address}
						/>
						<p className={styles.errorMessage}>{errorMessage.address}</p>
					</label>
					<div>
						<div className={styles.label}>Delivery Method</div>
						<div className="space-y-2 py-2">
							{field.delivery.map((option, index) => (
								<label className={styles.optionLabel} key={index}>
									<input className={styles.optionInput} {...option} />
									<span
										className={
											errorMessage.delivery
												? styles.optionWithError
												: styles.option
										}
									>
										{option.value}
									</span>
								</label>
							))}
						</div>
					</div>
					<label className="block">
						<div className={styles.label}>Remarks</div>
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
	item: f.input('text').required('Product name is required'),
	quantity: f.input('number', 'Invalid').required('Required').min(1, 'Min. 1'),
};

interface ProductFieldsetProps extends Partial<FieldsetOptions> {
	label: string;
}

function ProductFieldset({ label, ...options }: ProductFieldsetProps) {
	const [field, error] = useFieldset(productFieldset, options);

	return (
		<fieldset className="flex gap-4">
			<label className="block flex-1">
				<div className={styles.label}>{label}</div>
				<input
					className={error.item ? styles.inputWithError : styles.input}
					{...field.item}
				/>
			</label>
			<label className="block w-16">
				<div className={styles.label}>Quantity</div>
				<input
					className={error.quantity ? styles.inputWithError : styles.input}
					{...field.quantity}
				/>
			</label>
		</fieldset>
	);
}
