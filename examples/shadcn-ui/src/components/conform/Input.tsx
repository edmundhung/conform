import { FieldMetadata, getInputProps } from '@conform-to/react';
import { Input } from '../ui/input';
import { ComponentProps } from 'react';

export const InputConform = ({
	meta,
	type,
	...props
}: {
	meta: FieldMetadata<string>;
	type: Parameters<typeof getInputProps>[1]['type'];
} & ComponentProps<typeof Input>) => {
	return (
		<Input
			{...getInputProps(meta, { type, ariaAttributes: true })}
			{...props}
		/>
	);
};
