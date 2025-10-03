import {
	type BaseMetadata,
	FormOptionsProvider,
} from '@conform-to/react/future';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import type {
	ExampleListBox,
	ExampleCombobox,
	ExampleSwitch,
	ExampleRadioGroup,
} from './form';

// Define custom metadata properties that matches the type of our custom form components
function defineCustomMetadata<FieldShape, ErrorShape>(
	metadata: BaseMetadata<FieldShape, ErrorShape>,
) {
	return {
		get listBoxProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultOptions,
			} satisfies Partial<React.ComponentProps<typeof ExampleListBox>>;
		},
		get comboboxProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
			} satisfies Partial<React.ComponentProps<typeof ExampleCombobox>>;
		},
		get switchProps() {
			return {
				name: metadata.name,
				defaultChecked: metadata.defaultChecked,
			} satisfies Partial<React.ComponentProps<typeof ExampleSwitch>>;
		},
		get radioGroupProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
			} satisfies Partial<React.ComponentProps<typeof ExampleRadioGroup>>;
		},
	};
}

type MetadataDefinition<FieldShape, ErrorShape> = ReturnType<
	typeof defineCustomMetadata<FieldShape, ErrorShape>
>;

// Extend the CustomMetadata interface with our UI component props
// This makes the custom metadata available on all field metadata objects
declare module '@conform-to/react/future' {
	interface CustomMetadata<FieldShape, ErrorShape>
		extends MetadataDefinition<FieldShape, ErrorShape> {}
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<FormOptionsProvider
			shouldValidate="onBlur"
			shouldRevalidate="onInput"
			defineCustomMetadata={defineCustomMetadata}
		>
			<App />
		</FormOptionsProvider>
	</StrictMode>,
);
