import * as markdoc from '@markdoc/markdoc';
import * as React from 'react';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import ReactSyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';

ReactSyntaxHighlighter.registerLanguage('tsx', tsx);

export function Aside({ children }: { children: React.ReactNode }) {
	return (
		<aside className="float-right sticky top-16 w-72 -mr-72 p-8 -mt-40">
			{children}
		</aside>
	);
}

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

export function Heading({
	level,
	children,
}: {
	level: number;
	children: React.ReactNode;
}) {
	const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	const id =
		typeof children === 'string'
			? children.replace(/[?]/g, '').replace(/\s+/g, '-').toLowerCase()
			: '';

	return (
		<HeadingTag id={id} className="-mt-24 pt-24">
			{children}
		</HeadingTag>
	);
}

export function parse(markdown: string) {
	const content = markdown
		.replace(
			/<details>\n?\s*<summary>(.+?)<\/summary>(.*?)<\/details>/gs,
			'{% details summary="$1" %}$2{% /details %}',
		)
		.replace(/<!-- (\/?aside) -->/g, '{% $1 %}');
	const ast = markdoc.parse(content);
	const node = markdoc.transform(ast, {
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
			heading: {
				render: 'Heading',
				attributes: {
					level: { type: Number, required: true, default: 1 },
				},
			},
		},
		tags: {
			aside: {
				render: 'Aside',
				description: 'Side notes',
			},
			details: {
				render: 'Details',
				description: 'Native Details tag',
				attributes: {
					summary: {
						type: String,
						description: 'Summary of the block',
					},
				},
			},
		},
	});

	return node;
}

export function Markdoc({ content }: { content: markdoc.RenderableTreeNodes }) {
	return (
		<section className="prose prose-zinc dark:prose-invert max-w-none pr-72">
			{markdoc.renderers.react(content, React, {
				components: {
					Aside,
					Details,
					Fence,
					Heading,
				},
			})}
		</section>
	);
}
