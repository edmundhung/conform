import * as markdoc from '@markdoc/markdoc';
import * as React from 'react';

export function Details({
	summary,
	children,
}: {
	summary: string;
	children: React.ReactElement;
}) {
	return (
		<details>
			<summary>{summary}</summary>
			{children}
		</details>
	);
}

export function parse(markdown: string) {
	const content = markdown.replace(
		/<details>\n?\s*<summary>(.+?)<\/summary>(.*?)<\/details>/gs,
		'{% details summary="$1" %}$2{% /details %}',
	);
	const ast = markdoc.parse(content);
	const result = markdoc.transform(ast, {
		tags: {
			details: {
				render: 'Details',
				description: 'Native Details tag',
				children: [],
				attributes: {
					summary: {
						type: String,
						description: 'Summary of the block',
					},
				},
			},
		},
	});

	return result;
}

export function render(node: markdoc.RenderableTreeNodes) {
	return markdoc.renderers.react(node, React, {
		components: {
			Details,
		},
	});
}
