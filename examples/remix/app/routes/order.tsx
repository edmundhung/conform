import type { ActionFunction } from '@remix-run/node';
import type { FieldConfig } from '@conform-to/dom';
import { Form, useActionData } from '@remix-run/react';
import { parse, createFieldset as resolve } from '@conform-to/zod';
import { useForm, useFieldset, useFieldList, f } from '@conform-to/react';
import { styles } from '~/helpers';
import * as z from 'zod';

const product = z.object({
	item: z.string({ required_error: 'Product name is required' }),
	quantity: z
		.number({ required_error: 'Required', invalid_type_error: 'Invalid' })
		.min(1, 'Min. 1'),
});

const order = z.object({
	products: z.array(product).min(1, 'At least 1 product is required'),
	address: z.string({ required_error: 'Address is required' }),
	delivery: z.enum(['standard', 'express']),
	remarks: z.string().optional(),
});

const schema = resolve(order);

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const formResult = parse(formData, order);

	return formResult;
};

export default function OrderForm() {
	const result = useActionData();
	const form = useForm({ initialReport: 'onBlur' });
	const [fieldset, fields] = useFieldset(schema, result);
	const [products, control] = useFieldList(fields.products);

	return (
		<>
			<main className="p-8">
				<div className="mb-4">Order Form</div>
				{result?.state === 'accepted' ? (
					<>
						<div className="mb-4 text-emerald-500">Success</div>
						<pre>{JSON.stringify(result?.value, null, 2)}</pre>
					</>
				) : null}
			</main>
			<Form
				method="post"
				className={`flex flex-col-reverse ${styles.form}`}
				{...form}
			>
				<button type="submit" className={styles.buttonPrimary}>
					Order now
				</button>
				<fieldset className="space-y-4" {...fieldset}>
					<div className="space-y-2">
						{products.map((product, index) => (
							<div className="flex items-end gap-4" key={product.key}>
								<div className="flex-1">
									<ProductFieldset
										label={`Product #${index + 1}`}
										{...product.config}
									/>
								</div>
								<button
									className={styles.buttonWarning}
									disabled={products.length === 1}
									{...control.remove(index)}
								>
									⨯
								</button>
							</div>
						))}
					</div>
					<button
						className={styles.buttonSecondary}
						disabled={products.length === 3}
						{...control.append()}
					>
						Add Product
					</button>
					<label className="block">
						<div className={styles.label}>Address</div>
						<input
							className={
								fields.address.error ? styles.inputWithError : styles.input
							}
							{...f.input(fields.address)}
						/>
						<p className={styles.errorMessage}>{fields.address.error}</p>
					</label>
					<div>
						<div className={styles.label}>Delivery Method</div>
						<div className="space-y-2 py-2">
							{order.shape.delivery.options.map((option) => (
								<label className={styles.optionLabel} key={option}>
									<input
										className={styles.optionInput}
										{...f.input(fields.delivery, {
											type: 'radio',
											value: option,
										})}
									/>
									<span
										className={
											fields.delivery.error
												? styles.optionWithError
												: styles.option
										}
									>
										{option}
									</span>
								</label>
							))}
						</div>
					</div>
					<label className="block">
						<div className={styles.label}>Remarks</div>
						<textarea
							className={
								fields.remarks.error ? styles.inputWithError : styles.input
							}
							{...f.textarea(fields.remarks)}
						/>
						<p className={styles.errorMessage}>{fields.remarks.error}</p>
					</label>
				</fieldset>
			</Form>
		</>
	);
}

const productSchema = resolve(product);

interface ProductFieldsetProps extends FieldConfig<z.infer<typeof product>> {
	label: string;
}

function ProductFieldset({ label, ...options }: ProductFieldsetProps) {
	const [fieldset, fields] = useFieldset(productSchema, options);

	return (
		<fieldset className="flex gap-4" {...fieldset}>
			<label className="block flex-1">
				<div className={styles.label}>{label}</div>
				<input
					className={fields.item.error ? styles.inputWithError : styles.input}
					{...f.input(fields.item)}
				/>
			</label>
			<label className="block w-16">
				<div className={styles.label}>Quantity</div>
				<input
					className={
						fields.quantity.error ? styles.inputWithError : styles.input
					}
					{...f.input(fields.quantity, { type: 'number' })}
				/>
			</label>
		</fieldset>
	);
}
