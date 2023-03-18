import type { RenderableTreeNodes } from '@markdoc/markdoc';
import { renderers } from '@markdoc/markdoc';
import { Link as RouterLink, useMatches } from '@remix-run/react';
import * as React from 'react';
import ReactSyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import darcula from 'react-syntax-highlighter/dist/cjs/styles/prism/darcula';
import clsx from 'clsx';
import { useInView } from 'framer-motion';
import { remToPx } from './util';

const style = {
	...darcula,
	'pre[class*="language-"]': {
		...darcula['pre[class*="language-"]'],
		background: '#111',
	},
};

ReactSyntaxHighlighter.registerLanguage('tsx', tsx);
ReactSyntaxHighlighter.registerLanguage('css', css);

export function useRootLoaderData() {
	const [root] = useMatches();

	return root.data;
}

export function Sandbox({
	title,
	src,
	children,
}: {
	title: string;
	src: string;
	children: React.ReactNode;
}) {
	const { repository, branch } = useRootLoaderData();
	const [hydated, setHydrated] = React.useState(false);

	React.useEffect(() => {
		setHydrated(true);
	}, []);

	if (!hydated) {
		return children;
	}

	const url = new URL(
		`https://codesandbox.io/embed/github/${repository}/tree/${branch}${src}`,
	);

	url.searchParams.set('editorsize', '60');

	return (
		<iframe
			title={title}
			src={url.toString()}
			className="min-h-[70vh] my-6 w-full aspect-[16/9] outline outline-1 outline-zinc-800 outline-offset-4 rounded"
			sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
		/>
	);
}

interface ButtonLinkProps extends React.ComponentProps<typeof RouterLink> {
	variant?: keyof typeof variantStylesForButton;
	arrow?: 'left' | 'right';
}

const variantStylesForButton = {
	primary:
		'rounded-full bg-zinc-900 py-1 px-3 text-white hover:bg-zinc-700 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-1 dark:ring-inset dark:ring-emerald-400/20 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300 dark:hover:ring-emerald-300',
	secondary:
		'rounded-full bg-zinc-100 py-1 px-3 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:ring-1 dark:ring-inset dark:ring-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
	filled:
		'rounded-full bg-zinc-900 py-1 px-3 text-white hover:bg-zinc-700 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400',
	outline:
		'rounded-full py-1 px-3 text-zinc-700 ring-1 ring-inset ring-zinc-900/10 hover:bg-zinc-900/2.5 hover:text-zinc-900 dark:text-zinc-400 dark:ring-white/10 dark:hover:bg-white/5 dark:hover:text-white',
	text: 'text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-500',
};

export function ButtonLink({
	variant = 'primary',
	className,
	children,
	arrow,
	...props
}: ButtonLinkProps) {
	const arrowIcon = (
		<svg
			className={clsx(
				'mt-0.5 h-5 w-5',
				variant === 'text' && 'relative top-px',
				arrow === 'left' && '-ml-1 rotate-180',
				arrow === 'right' && '-mr-1',
			)}
			viewBox="0 0 20 20"
			fill="none"
			aria-hidden="true"
		>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="m11.5 6.5 3 3.5m0 0-3 3.5m3-3.5h-9"
			/>
		</svg>
	);

	return (
		<RouterLink
			className={clsx(
				'inline-flex gap-0.5 justify-center overflow-hidden text-sm font-medium transition',
				variantStylesForButton[variant],
				className,
			)}
			{...props}
		>
			{arrow === 'left' ? arrowIcon : null}
			{children}
			{arrow === 'right' ? arrowIcon : null}
		</RouterLink>
	);
}

export function Aside({ children }: { children: React.ReactNode }) {
	return (
		<aside
			className={`
				-ml-4 xl:ml-0 mb-8 xl:float-right xl:sticky xl:top-16 xl:w-72 xl:-mr-72 xl:pl-4 xl:py-8 xl:-mt-48 xl:max-h-[calc(100vh-4rem)] overflow-y-auto
				prose-ul:list-none prose-ul:m-0 prose-ul:pl-4 prose-li:m-0 prose-li:pl-0 prose-headings:pl-4
				prose-a:block prose-a:py-2 prose-a:no-underline prose-a:font-normal prose-a:text-zinc-400
				hover:prose-a:text-white
			`}
		>
			{children}
		</aside>
	);
}

export function Lead({ children }: { children: React.ReactNode }) {
	return (
		<div
			className={`
				lead
			`}
		>
			{children}
		</div>
	);
}

export function Grid({ children }: { children: React.ReactNode }) {
	return (
		<div
			className={`
			  mt-4 grid grid-cols-1 gap-x-6 gap-y-10 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3
			`}
		>
			{children}
		</div>
	);
}

export function Cell({
	image,
	children,
}: {
	image: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={`
				prose-h3:text-sm prose-h3:font-semibold prose-h3:text-zinc-900 dark:prose-h3:text-white
				prose-p:mt-1 prose-p:text-sm prose-p:text-zinc-600 dark:prose-p:text-zinc-400
				prose-a:inline-flex prose-a:gap-0.5 prose-a:justify-center prose-a:overflow-hidden prose-a:text-sm prose-a:font-medium prose-a:transition prose-a:text-emerald-500 hover:prose-a:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-500
			`}
		>
			<div className="flex flex-row-reverse gap-6">
				<div className="flex-auto">{children}</div>
				<img
					className="h-12 w-12"
					src="https://protocol.tailwindui.com/_next/static/media/go.135b57cb.svg"
					alt={image}
				/>
			</div>
		</div>
	);
}

export function Attributes({ children }: { children: React.ReactNode }) {
	return (
		<div
			className={`
				m-0 flex flex-wrap items-center gap-x-3 gap-y-2
				prose-em:inline prose-em:font-mono prose-em:text-xs prose-em:text-zinc-400 dark:prose-em:text-zinc-500 prose-em:block
				prose-p:w-full prose-p:flex-none prose-p:mt-4 prose-p:[&>:first-child]:mt-0 prose-p:[&>:first-child]:mb-0
			`}
		>
			{children}
		</div>
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

interface HeaderProps
	extends React.DetailedHTMLProps<
		React.HTMLAttributes<HTMLHeadingElement>,
		HTMLHeadingElement
	> {
	level?: 1 | 2 | 3 | 4 | 5 | 6;
	tag?: string;
	label?: string;
	anchor?: boolean;
}

export function Heading({
	level = 2,
	children,
	id,
	tag,
	label,
	anchor = true,
	...props
}: HeaderProps) {
	const Component = `h${level}` as const;
	const ref = React.useRef<HTMLHeadingElement>(null);
	// const registerHeading = useSectionStore((s) => s.registerHeading);
	const inView = useInView(ref, {
		margin: `${remToPx(-3.5)}px 0px 0px 0px`,
		amount: 'all',
	});
	const hash =
		id ??
		(typeof children === 'string'
			? children.replace(/[?]/g, '').replace(/\s+/g, '-').toLowerCase()
			: '');

	// useEffect(() => {
	// 	if (level === 2) {
	// 		registerHeading({ id, ref, offsetRem: tag || label ? 8 : 6 });
	// 	}
	// }, [level, registerHeading]);

	return (
		<>
			{tag || label ? (
				<div className="flex items-center gap-x-3">
					{tag && <Tag>{tag}</Tag>}
					{tag && label && (
						<span className="h-0.5 w-0.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
					)}
					{label && (
						<span className="font-mono text-xs text-zinc-400">{label}</span>
					)}
				</div>
			) : null}
			<Component
				ref={ref}
				id={anchor ? hash : undefined}
				className={tag || label ? 'mt-2 scroll-mt-32' : 'scroll-mt-24'}
				{...props}
			>
				{anchor ? (
					<RouterLink
						to={`#${hash}`}
						className="group text-inherit no-underline hover:text-inherit"
					>
						{inView && (
							<div className="absolute mt-1 ml-[calc(-1*var(--width))] hidden w-[var(--width)] opacity-0 transition [--width:calc(2.625rem+0.5px+50%-min(50%,calc(theme(maxWidth.lg)+theme(spacing.8))))] group-hover:opacity-100 group-focus:opacity-100 md:block lg:z-50 2xl:[--width:theme(spacing.10)]">
								<div className="group/anchor block h-5 w-5 rounded-lg bg-zinc-50 ring-1 ring-inset ring-zinc-300 transition hover:ring-zinc-500 dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:hover:ring-zinc-600">
									<svg
										className="h-5 w-5 stroke-zinc-500 transition dark:stroke-zinc-400 dark:group-hover/anchor:stroke-white"
										viewBox="0 0 20 20"
										fill="none"
										strokeLinecap="round"
										aria-hidden="true"
									>
										<path d="m6.5 11.5-.964-.964a3.535 3.535 0 1 1 5-5l.964.964m2 2 .964.964a3.536 3.536 0 0 1-5 5L8.5 13.5m0-5 3 3" />
									</svg>
								</div>
							</div>
						)}
						{children}
					</RouterLink>
				) : (
					children
				)}
			</Component>
		</>
	);
}

interface TagProps {
	variant?: keyof typeof variantStyles;
	color?: keyof typeof colorStyles;
	children: string;
}

const variantStyles = {
	small: '',
	medium: 'rounded-lg px-1.5 ring-1 ring-inset',
};

const colorStyles = {
	emerald: {
		small: 'text-emerald-500 dark:text-emerald-400',
		medium:
			'ring-emerald-300 dark:ring-emerald-400/30 bg-emerald-400/10 text-emerald-500 dark:text-emerald-400',
	},
	sky: {
		small: 'text-sky-500',
		medium:
			'ring-sky-300 bg-sky-400/10 text-sky-500 dark:ring-sky-400/30 dark:bg-sky-400/10 dark:text-sky-400',
	},
	amber: {
		small: 'text-amber-500',
		medium:
			'ring-amber-300 bg-amber-400/10 text-amber-500 dark:ring-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400',
	},
	rose: {
		small: 'text-red-500 dark:text-rose-500',
		medium:
			'ring-rose-200 bg-rose-50 text-red-500 dark:ring-rose-500/20 dark:bg-rose-400/10 dark:text-rose-400',
	},
	zinc: {
		small: 'text-zinc-400 dark:text-zinc-500',
		medium:
			'ring-zinc-200 bg-zinc-50 text-zinc-500 dark:ring-zinc-500/20 dark:bg-zinc-400/10 dark:text-zinc-400',
	},
};

const valueColorMap: Record<string, keyof typeof colorStyles> = {
	get: 'emerald',
	post: 'sky',
	put: 'amber',
	delete: 'rose',
};

export function Tag({
	children,
	variant = 'medium',
	color = valueColorMap[children.toLowerCase()] ?? 'emerald',
}: TagProps) {
	return (
		<span
			className={clsx(
				'font-mono text-[0.625rem] font-semibold leading-6',
				variantStyles[variant],
				colorStyles[color][variant],
			)}
		>
			{children}
		</span>
	);
}

interface LinkProps {
	href: string;
	title: string;
	children: React.ReactNode;
}

export function Link({ href, title, children }: LinkProps) {
	const origin = 'https://conform.guide';
	const url = href.startsWith(origin) ? href.replace(origin, '') : href;

	if (
		url.startsWith('https://') ||
		url.startsWith('http://') ||
		url.startsWith('//')
	) {
		return (
			<a href={url} title={title}>
				{children}
			</a>
		);
	}

	let to = url;

	if (to.startsWith('/packages/')) {
		to = to.replace('/packages/conform-', '/api/').replace('/README.md', '');
	} else if (to.startsWith('/docs/')) {
		to = to.replace('/docs', '').replace('.md', '');
	} else {
		to = to.replace('.md', '');
	}

	return (
		<RouterLink to={to} title={title} prefetch="intent">
			{children}
		</RouterLink>
	);
}

export function Markdown({ content }: { content: RenderableTreeNodes }) {
	return (
		<div className="prose dark:prose-invert max-w-none">
			{renderers.react(content, React, {
				components: {
					Lead,
					Grid,
					Cell,
					Attributes,
					Aside,
					Sandbox,
					Details,
					Fence,
					Heading,
					Link,
				},
			})}
		</div>
	);
}
