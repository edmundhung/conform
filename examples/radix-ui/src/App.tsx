import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { Checkbox } from './ui/Checkbox';
import { RadioGroup } from './ui/RadioGroup';
import { Slider } from './ui/Slider';
import { Switch } from './ui/Switch';
import { ToggleGroup } from './ui/ToggleGroup';
import { Select } from './ui/Select';

const schema = z.object({
	hasAgreedToTerms: z.boolean({
		required_error: 'You must agree to the terms and conditions',
	}),
	selectedCarType: z.enum(['sedan', 'hatchback', 'suv']),
	userCountry: z.enum(['usa', 'canada', 'mexico']),
	estimatedKilometersPerYear: z.number().min(1).max(100000),
	hasAdditionalDriver: z
		.boolean()
		.optional()
		.refine((flag) => !flag, {
			message: 'You cannot have an additional driver',
		}),
	desiredContractType: z.enum(['full', 'part']),
});

export function App() {
	const [
		form,
		{
			hasAgreedToTerms,
			selectedCarType,
			userCountry,
			estimatedKilometersPerYear,
			hasAdditionalDriver,
			desiredContractType,
		},
	] = useForm({
		id: 'car-rent',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		onSubmit(e) {
			e.preventDefault();
			const form = e.currentTarget;
			const formData = new FormData(form);
			const data = Object.fromEntries(formData.entries());
			alert(JSON.stringify(data, null, 2));
		},
		defaultValue: {
			selectedCarType: 'sedan',
			desiredContractType: 'full',
		},
		shouldRevalidate: 'onInput',
	});

	return (
		<main className="flex flex-col gap-4 p-12 font-sans">
			<form
				method="POST"
				id={form.id}
				onSubmit={form.onSubmit}
				className="bg-neutral-100 flex flex-col gap-12 p-12 rounded-lg mx-auto"
			>
				<h1 className="font-bold text-4xl text-amber-800">
					Radix UI + Conform
				</h1>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Checkbox</h2>
					<div className="flex items-center gap-2">
						<Checkbox meta={hasAgreedToTerms} />
						<label htmlFor={hasAgreedToTerms.id}>
							Accept terms and conditions.
						</label>
					</div>
					{hasAgreedToTerms.errors && (
						<span className="text-red-800">{hasAgreedToTerms.errors}</span>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Radio Group</h2>
					<div className="flex flex-col gap-2">
						Car type:
						<RadioGroup
							meta={selectedCarType}
							items={[
								{ value: 'sedan', label: 'Sedan' },
								{ value: 'hatchback', label: 'Hatchback' },
								{ value: 'suv', label: 'SUV' },
								{ value: 'other', label: 'Other (not valid choice)' },
							]}
						/>
						{selectedCarType.errors && (
							<span className="text-red-800">{selectedCarType.errors}</span>
						)}
					</div>
				</div>
				<div className="flex flex-col gap-2 items-start">
					<h2 className="text-medium text-amber-600">Select</h2>
					<label htmlFor={userCountry.id}>Country</label>
					<Select
						meta={userCountry}
						placeholder="Select a country 🗺"
						items={[
							{ name: 'USA', value: 'usa' },
							{ name: 'Canada', value: 'canada' },
							{ name: 'Mexico', value: 'mexico' },
						]}
					/>
					{userCountry.errors && (
						<span className="text-red-800">{userCountry.errors}</span>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Slider</h2>
					<div className="flex flex-col gap-2">
						Estimated kilometers per year:
						<Slider
							meta={estimatedKilometersPerYear}
							ariaLabel="Estimated kilometers per year"
							max={10_000}
						/>
						{estimatedKilometersPerYear.errors && (
							<span className="text-red-800">
								{estimatedKilometersPerYear.errors}
							</span>
						)}
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Switch</h2>
					<div className="flex items-center gap-2">
						<Switch meta={hasAdditionalDriver} />
						<label htmlFor={hasAdditionalDriver.id}>
							Has additional driver
						</label>
					</div>
					{hasAdditionalDriver.errors && (
						<span className="text-red-800">{hasAdditionalDriver.errors}</span>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Toggle group</h2>
					<div className="flex flex-col gap-2">
						Desired contract type:
						<ToggleGroup
							meta={desiredContractType}
							items={[
								{ value: 'full', label: 'Full' },
								{ value: 'part', label: 'Part time' },
								{ value: 'not valid', label: 'not Valid' },
							]}
						/>
						{desiredContractType.errors && (
							<span className="text-red-800">{desiredContractType.errors}</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="submit"
						className="bg-amber-800 px-3 py-2 rounded-lg text-white hover:opacity-90 grow"
					>
						Continue
					</button>
					<button
						type="reset"
						className="text-amber-800 hover:opacity-90 px-3 py-2 border-neutral-300 border rounded-lg grow"
					>
						Reset
					</button>
				</div>
			</form>
		</main>
	);
}
