import { FieldMetadata, getTextareaProps } from '@conform-to/react';
import { Textarea } from '@/components/ui/textarea';
import { ComponentProps } from 'react';

export const TextareaConform = ({
	meta,
	...props
}: {
	meta: FieldMetadata<string>;
} & ComponentProps<typeof Textarea>) => {
	return <Textarea {...getTextareaProps(meta)} {...props} />;
};
