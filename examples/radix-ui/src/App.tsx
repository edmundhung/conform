import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useState } from 'react';
import { z } from 'zod';
import {
	ExampleCheckbox,
	ExampleRadioGroup,
	ExampleSlider,
	ExampleSwitch,
	ExampleToggleGroup,
	ExampleSelect,
} from './form';

const schema = z.object({
	isTermsAgreed: z.boolean(),
	carType: z.enum(['sedan', 'hatchback', 'suv']),
	userCountry: z.enum(['usa', 'canada', 'mexico']),
	estimatedKilometersPerYear: z.number().min(1).max(100000),
	insurance: z.boolean(),
	desiredContractType: z.enum(['full', 'part']),
});

export default function App() {
	const [submittedValue, setSubmittedValue] = useState<z.output<
		typeof schema
	> | null>(null);
	const [searchParams, setSearchParams] = useState(
		() => new URLSearchParams(window.location.search),
	);
	const [form, fields] = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		defaultValue: {
			isTermsAgreed: searchParams.get('isTermsAgreed'),
			carType: searchParams.get('carType'),
			userCountry: searchParams.get('userCountry'),
			estimatedKilometersPerYear: searchParams.get(
				'estimatedKilometersPerYear',
			),
			insurance: searchParams.get('insurance'),
			desiredContractType: searchParams.get('desiredContractType'),
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		onSubmit(event, { formData, submission }) {
			event.preventDefault();

			// Demo only - This emulates a GET request with the form data populated in the URL.
			const url = new URL(document.URL);
			const searchParams = new URLSearchParams(
				Array.from(formData).filter(
					// Skip the file as it is not serializable
					(entry): entry is [string, string] => typeof entry[1] === 'string',
				),
			);
			url.search = searchParams.toString();
			window.history.pushState(null, '', url);

			setSearchParams(searchParams);

			if (submission?.status === 'success') {
				setSubmittedValue(submission.value);
			}
		},
	});

	return (
		<main className="flex flex-col gap-4 p-12 font-sans">
			<form
				id={form.id}
				onSubmit={form.onSubmit}
				onChange={() => setSubmittedValue(null)}
				className="flex flex-col gap-12 p-12 rounded-lg mx-auto"
				noValidate
			>
				<h1 className="font-bold text-4xl">Radix UI Example</h1>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Checkbox</h2>
					<div className="flex items-center gap-2">
						<ExampleCheckbox
							name={fields.isTermsAgreed.name}
							value="on"
							defaultChecked={fields.isTermsAgreed.defaultValue === 'on'}
						/>
						<label>Accept terms and conditions.</label>
					</div>
					<span className="text-red-500">{fields.isTermsAgreed.errors}</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Radio Group</h2>
					<div className="flex flex-col gap-2">
						Car type:
						<ExampleRadioGroup
							name={fields.carType.name}
							defaultValue={fields.carType.defaultValue}
							items={[
								{ value: 'sedan', label: 'Sedan' },
								{ value: 'hatchback', label: 'Hatchback' },
								{ value: 'suv', label: 'SUV' },
								{ value: 'other', label: 'Other (not valid choice)' },
							]}
						/>
						<span className="text-red-500">{fields.carType.errors}</span>
					</div>
				</div>
				<div className="flex flex-col gap-2 items-start">
					<h2 className="text-medium">Select</h2>
					<label>Country</label>
					<ExampleSelect
						name={fields.userCountry.name}
						defaultValue={fields.userCountry.defaultValue}
						placeholder="Select a country 🗺"
						items={[
							{ name: 'USA', value: 'usa' },
							{ name: 'Canada', value: 'canada' },
							{ name: 'Mexico', value: 'mexico' },
						]}
					/>
					<span className="text-red-500">{fields.userCountry.errors}</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Slider</h2>
					<div className="flex flex-col gap-2">
						Estimated kilometers per year:
						<ExampleSlider
							name={fields.estimatedKilometersPerYear.name}
							defaultValue={fields.estimatedKilometersPerYear.defaultValue}
							max={10_000}
						/>
						<span className="text-red-500">
							{fields.estimatedKilometersPerYear.errors}
						</span>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Switch</h2>
					<div className="flex items-center gap-2">
						<ExampleSwitch
							name={fields.insurance.name}
							value="on"
							defaultChecked={fields.insurance.defaultValue === 'on'}
						/>
						<label>Insurance</label>
					</div>
					<span className="text-red-500">{fields.insurance.errors}</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Toggle group</h2>
					<div className="flex flex-col gap-2">
						Desired contract type:
						<ExampleToggleGroup
							name={fields.desiredContractType.name}
							defaultValue={fields.desiredContractType.defaultValue}
							items={[
								{ value: 'full', label: 'Full' },
								{ value: 'part', label: 'Part time' },
								{ value: 'not valid', label: 'not Valid' },
							]}
						/>
						<span className="text-red-500">
							{fields.desiredContractType.errors}
						</span>
					</div>
				</div>

				{submittedValue ? (
					<div className="flex flex-col gap-2">
						<h4>Value submitted</h4>
						<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
					</div>
				) : null}

				<div className="flex items-center gap-3">
					<button
						type="submit"
						className="bg-neutral-800 px-3 py-2 rounded-lg text-white hover:opacity-90 grow"
					>
						Submit
					</button>
					<button
						type="button"
						className="hover:opacity-90 px-3 py-2 border-neutral-300 border rounded-lg grow"
						onClick={() => form.reset()}
					>
						Reset
					</button>
				</div>
			</form>
		</main>
	);
}
