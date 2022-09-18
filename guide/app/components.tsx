import type { RenderableTreeNodes } from '@markdoc/markdoc';
import { renderers } from '@markdoc/markdoc';
import { Link as RouterLink } from '@remix-run/react';
import * as React from 'react';
import ReactSyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import style from 'react-syntax-highlighter/dist/cjs/styles/prism/darcula';

ReactSyntaxHighlighter.registerLanguage('tsx', tsx);
ReactSyntaxHighlighter.registerLanguage('css', css);

export function Sandbox({ title, path }: { title: string; path: string }) {
	const [hydated, setHydrated] = React.useState(false);

	React.useEffect(() => {
		setHydrated(true);
	}, []);

	if (!hydated) {
		return null;
	}

	return (
		<iframe
			title={title}
			src={`https://codesandbox.io/embed/github/${path}?editorsize=60`}
			className="my-10 w-full aspect-[16/9] outline outline-zinc-800 outline-offset-4"
			sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
		/>
	);
}

export function Aside({ children }: { children: React.ReactNode }) {
	return (
		<aside
			className={`
				xl:float-right xl:sticky xl:top-16 xl:w-72 xl:-mr-72 xl:pl-8 xl:py-8 xl:-mt-48 xl:h-[calc(100vh-4rem)] overflow-y-auto
				prose-ul:list-none prose-ul:m-0 prose-ul:pl-0 prose-li:m-0 prose-li:pl-0
				prose-a:block prose-a:border-l prose-a:px-4 prose-a:py-2 prose-a:no-underline prose-a:text-zinc-400 prose-a:border-zinc-700
				hover:prose-a:text-white hover:prose-a:border-white 
			`}
		>
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

export function Markdown({ content }: { content: RenderableTreeNodes }) {
	return (
		<section className="prose prose-zinc dark:prose-invert max-w-none xl:pr-72 prose-pre:!my-6">
			{renderers.react(content, React, {
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
