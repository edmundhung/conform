import {
	type FieldsetConfig,
	type Submission,
	useForm,
	useFieldset,
	useFieldList,
	conform,
} from '@conform-to/react';
import { resolve } from '@conform-to/zod';
import { type ActionFunction } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { useRef } from 'react';
import { z } from 'zod';
import { styles } from '~/helpers';

const product = resolve(
	z.object({
		item: z.string({ required_error: 'Product name is required' }),
		quantity: z.preprocess(
			(data) => (typeof data !== 'undefined' ? Number(data) : data),
			z
				.number({ required_error: 'Required', invalid_type_error: 'Invalid' })
				.min(1, 'Min. 1'),
		),
	}),
);

const shipping = resolve(
	z.object({
		address: z.string({ required_error: 'Address is required' }),
		delivery: z.enum(['standard', 'express']),
	}),
);

const order = resolve(
	z.object({
		products: z.array(product.source).min(1, 'At least 1 product is required'),
		shipping: shipping.source,
		remarks: z.string().optional(),
	}),
);

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const submission = order.parse(formData);

	return submission;
};

export default function OrderForm() {
	const submission = useActionData<Submission<z.infer<typeof order.source>>>();
	const formProps = useForm({
		initialReport: 'onBlur',
		validate: order.validate,
	});
	const { products, shipping, remarks } = useFieldset(formProps.ref, {
		constraint: order.constraint,
		defaultValue: submission?.form.value,
		initialError: submission?.form.error.details,
	});
	const [productList, control] = useFieldList(formProps.ref, products.config);

	return (
		<Form method="post" {...formProps}>
			<header className={styles.header}>
				<h1>Order Form</h1>
				{submission?.state === 'accepted' ? (
					<pre className={styles.result}>
						{JSON.stringify(submission?.data, null, 2)}
					</pre>
				) : null}
			</header>
			<fieldset className={styles.card}>
				<div className={styles.list}>
					{productList.map((product, index) => (
						<div className={styles.row} key={product.key}>
							<div className={styles.rowContent}>
								<ProductFieldset
									label={`Product #${index + 1}`}
									{...product.config}
								/>
							</div>
							<button
								className={styles.buttonWarning}
								disabled={productList.length === 1}
								{...control.remove({ index })}
							>
								⨯
							</button>
						</div>
					))}
				</div>
				<button className={styles.buttonSecondary} {...control.append()}>
					Add Product
				</button>
				<ShippingFieldset {...shipping.config} />
				<label className={styles.block}>
					<div className={styles.label}>Remarks</div>
					<textarea
						className={remarks.error ? styles.invalidInput : styles.input}
						{...conform.textarea(remarks.config)}
					/>
					<p className={styles.errorMessage}>{remarks.error}</p>
				</label>

				<button type="submit" className={styles.buttonPrimary}>
					Order now
				</button>
			</fieldset>
		</Form>
	);
}

function ShippingFieldset(
	config: FieldsetConfig<z.infer<typeof shipping.source>>,
) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { address, delivery } = useFieldset(ref, {
		constraint: shipping.constraint,
		...config,
	});

	return (
		<fieldset ref={ref}>
			<label className="block">
				<div className={styles.label}>Address</div>
				<input
					className={address.error ? styles.invalidInput : styles.input}
					{...conform.input(address.config)}
				/>
				<p className={styles.errorMessage}>{address.error}</p>
			</label>
			<div>
				<div className={styles.label}>Delivery Method</div>
				<div className="space-y-2 py-2">
					{shipping.source.shape.delivery.options.map((option) => (
						<label className={styles.optionLabel} key={option}>
							<input
								className={styles.optionInput}
								{...conform.input(delivery.config, {
									type: 'radio',
									value: option,
								})}
							/>
							<span
								className={
									delivery.error ? styles.invalidOption : styles.option
								}
							>
								{option}
							</span>
						</label>
					))}
				</div>
			</div>
		</fieldset>
	);
}

function ProductFieldset({
	label,
	...config
}: FieldsetConfig<z.infer<typeof product.source>> & { label: string }) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { item, quantity } = useFieldset(ref, {
		constraint: product.constraint,
		...config,
	});

	return (
		<fieldset className="flex gap-4" ref={ref}>
			<label className="block flex-1">
				<div className={styles.label}>{label}</div>
				<input
					className={item.error ? styles.invalidInput : styles.input}
					{...conform.input(item.config)}
				/>
			</label>
			<label className="block w-16">
				<div className={styles.label}>Quantity</div>
				<input
					className={quantity.error ? styles.invalidInput : styles.input}
					{...conform.input(quantity.config, { type: 'number' })}
				/>
			</label>
		</fieldset>
	);
}
