import * as markdoc from '@markdoc/markdoc';
import { Link as RouterLink } from '@remix-run/react';
import * as React from 'react';
import ReactSyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import style from 'react-syntax-highlighter/dist/cjs/styles/prism/darcula';

ReactSyntaxHighlighter.registerLanguage('tsx', tsx);
ReactSyntaxHighlighter.registerLanguage('css', css);

export function Aside({ children }: { children: React.ReactNode }) {
	return (
		<aside className="xl:float-right xl:sticky xl:top-16 xl:w-72 xl:-mr-72 xl:pl-8 xl:py-8 xl:-mt-48 xl:max-h-[calc(100vh-4rem)] overflow-y-auto">
			{children}
		</aside>
	);
}

export function Fence({
	language,
	children,
}: {
	language: string;
	children: string;
}): React.ReactElement {
	return (
		<ReactSyntaxHighlighter
			language={language}
			style={style}
			showLineNumbers={language === 'tsx' || language === 'css'}
		>
			{children}
		</ReactSyntaxHighlighter>
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
		<details className="border border-zinc-700 rounded p-4 my-6">
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
		<HeadingTag id={id} className="-mt-20 pt-20 lg:-mt-24 lg:pt-24">
			{children}
		</HeadingTag>
	);
}

export function Link({
	href,
	title,
	children,
}: {
	href: string;
	title: string;
	children: React.ReactNode;
}) {
	if (
		href.startsWith('https://') ||
		href.startsWith('http://') ||
		href.startsWith('//')
	) {
		return (
			<a href={href} title={title}>
				{children}
			</a>
		);
	}

	let to = href;

	if (to.startsWith('/packages/')) {
		to = to.replace('/packages/conform-', '/api/').replace('/README.md', '');
	}

	return (
		<RouterLink to={to} title={title} prefetch="intent">
			{children}
		</RouterLink>
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
			link: {
				render: 'Link',
				attributes: {
					href: { type: String, required: true },
					title: { type: String },
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
		<section className="prose prose-zinc dark:prose-invert max-w-none xl:pr-72 prose-pre:!my-6">
			{markdoc.renderers.react(content, React, {
				components: {
					Aside,
					Details,
					Fence,
					Heading,
					Link,
				},
			})}
		</section>
	);
}
