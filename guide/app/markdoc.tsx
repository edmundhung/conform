import * as markdoc from '@markdoc/markdoc';
import * as React from 'react';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import ReactSyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light';
import ts from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';

ReactSyntaxHighlighter.registerLanguage('ts', ts);
ReactSyntaxHighlighter.registerLanguage('tsx', tsx);

export function Fence({
	language,
	useInlineStyles = false,
	showLineNumbers = language === 'tsx',
	...props
}: SyntaxHighlighterProps): React.ReactElement {
	return (
		<ReactSyntaxHighlighter
			language={language}
			useInlineStyles={false}
			showLineNumbers={showLineNumbers}
			{...props}
		/>
	);
}

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
		nodes: {
			fence: {
				render: 'Fence',
				attributes: {
					language: {
						type: String,
						description:
							'The programming language of the code block. Place it after the backticks.',
					},
				},
			},
		},
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
			Fence,
		},
	});
}
