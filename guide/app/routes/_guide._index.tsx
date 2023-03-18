import { Link } from '@remix-run/react';
import { useMotionValue } from 'framer-motion';
import { ButtonLink, Heading } from '~/components';
import { ResourcePattern } from '~/pattern';

const guides = [
	{
		to: '/validation',
		name: 'Validation',
		description: 'bla bla bla.',
	},
	{
		to: '/integrations',
		name: 'Integrations????',
		description: 'bla bla bla.',
	},
	{
		to: '/configuration',
		name: 'Nested object and Array',
		description: 'bla bla bla.',
	},
	{
		to: '/intent-button',
		name: 'Intent button',
		description: 'bla bla bla.',
	},
	{
		to: '/file-upload',
		name: 'File upload',
		description: 'bla bla bla.',
	},
	{
		to: '/focus-management',
		name: 'Focus management',
		description: 'bla bla bla.',
	},
	{
		to: '/accessibility',
		name: 'Accessibility',
		description: 'bla bla bla.',
	},
];

// from Resources.jsx
const resources = [
	{
		to: '/api/react',
		name: '@conform-to/react',
		description: 'bla bla bla.',
		icon: UserIcon,
		pattern: {
			y: 16,
			squares: [
				[0, 1],
				[1, 3],
			] as Array<[number, number]>,
		},
	},
	{
		to: '/api/yup',
		name: '@conform-to/yup',
		description: 'bla bla bla.',
		icon: ChatBubbleIcon,
		pattern: {
			y: -6,
			squares: [
				[-1, 2],
				[1, 3],
			] as Array<[number, number]>,
		},
	},
	{
		to: '/api/zod',
		name: '@conform-to/zod',
		description: 'bla bla bla.',
		icon: EnvelopeIcon,
		pattern: {
			y: 32,
			squares: [
				[0, 2],
				[1, 4],
			] as Array<[number, number]>,
		},
	},
	// {
	//   to: '/api/react',
	//   name: '@conform-to/react',
	//   description:
	//     'bla bla bla.',
	//   icon: UsersIcon,
	//   pattern: {
	//     y: 22,
	//     squares: [[0, 1]],
	//   },
	// },
];

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
			<path
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M10.046 16H1.955a.458.458 0 0 1-.455-.459C1.5 13.056 3.515 11 6 11h.5"
			/>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M7.5 15.454C7.5 12.442 9.988 10 13 10s5.5 2.442 5.5 5.454a.545.545 0 0 1-.546.546H8.045a.545.545 0 0 1-.545-.546Z"
			/>
			<path
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M6.5 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
			/>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M13 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
			/>
		</svg>
	);
}

function ChatBubbleIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M10 16.5c4.142 0 7.5-3.134 7.5-7s-3.358-7-7.5-7c-4.142 0-7.5 3.134-7.5 7 0 1.941.846 3.698 2.214 4.966L3.5 17.5c2.231 0 3.633-.553 4.513-1.248A8.014 8.014 0 0 0 10 16.5Z"
			/>
			<path
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M7.5 8.5h5M8.5 11.5h3"
			/>
		</svg>
	);
}

export function EnvelopeIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
			<path
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M2.5 5.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-8Z"
			/>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M10 10 4.526 5.256c-.7-.607-.271-1.756.655-1.756h9.638c.926 0 1.355 1.15.655 1.756L10 10Z"
			/>
		</svg>
	);
}

function Resource({ resource }: { resource: (typeof resources)[0] }) {
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	return (
		<div
			className="group relative flex rounded-2xl bg-zinc-50 transition-shadow hover:shadow-md hover:shadow-zinc-900/5 dark:bg-white/2.5 dark:hover:shadow-black/5"
			onMouseMove={(event) => {
				const { left, top } = event.currentTarget.getBoundingClientRect();
				mouseX.set(event.clientX - left);
				mouseY.set(event.clientY - top);
			}}
		>
			<ResourcePattern {...resource.pattern} mouseX={mouseX} mouseY={mouseY} />
			<div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-zinc-900/7.5 group-hover:ring-zinc-900/10 dark:ring-white/10 dark:group-hover:ring-white/20" />
			<div className="relative rounded-2xl px-4 pt-16 pb-4">
				<div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/5 ring-1 ring-zinc-900/25 backdrop-blur-[2px] transition duration-300 group-hover:bg-white/50 group-hover:ring-zinc-900/25 dark:bg-white/7.5 dark:ring-white/15 dark:group-hover:bg-emerald-300/10 dark:group-hover:ring-emerald-400">
					<resource.icon className="h-5 w-5 fill-zinc-700/10 stroke-zinc-700 transition-colors duration-300 group-hover:stroke-zinc-900 dark:fill-white/10 dark:stroke-zinc-400 dark:group-hover:fill-emerald-300/10 dark:group-hover:stroke-emerald-400" />
				</div>
				<h3 className="mt-4 text-sm font-semibold leading-7 text-zinc-900 dark:text-white">
					<Link to={resource.to}>
						<span className="absolute inset-0 rounded-2xl" />
						{resource.name}
					</Link>
				</h3>
				<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
					{resource.description}
				</p>
			</div>
		</div>
	);
}

export default function Index() {
	return (
		<div className="prose dark:prose-invert">
			<h1>Overview</h1>
			<p className="lead">bla bla bla</p>
			<div className="not-prose mb-16 mt-6 flex gap-3">
				<ButtonLink to="/tutorial" arrow="right">
					Tutorial
				</ButtonLink>
				<ButtonLink to="/integrations" variant="outline">
					Explore Integrations
				</ButtonLink>
			</div>
			<h2 className="scroll-mt-24">Getting started</h2>
			<p className="lead">
				bla bla bla <a href="/#">developer settings</a>, bla bla bla{' '}
				<a href="/#">integrations directory</a> .
			</p>
			<div className="not-prose">
				<ButtonLink
					to="/integrations"
					variant="text"
					arrow="right"
					children="Get your pension xD"
				/>
			</div>
			<div className="my-16 xl:max-w-none">
				<Heading level={2} id="guides">
					Guides
				</Heading>
				<div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:grid-cols-4">
					{guides.map((guide) => (
						<div key={guide.to}>
							<h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
								{guide.name}
							</h3>
							<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
								{guide.description}
							</p>
							<p className="mt-4">
								<ButtonLink to={guide.to} variant="text" arrow="right">
									Read more
								</ButtonLink>
							</p>
						</div>
					))}
				</div>
			</div>
			<div className="my-16 xl:max-w-none">
				<Heading level={2} id="resources">
					API references
				</Heading>
				<div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:grid-cols-4">
					{resources.map((resource) => (
						<Resource key={resource.to} resource={resource} />
					))}
				</div>
			</div>
		</div>
	);
}
