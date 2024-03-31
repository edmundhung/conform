import { Link, useLocation } from '@remix-run/react';
import {
	type Menu,
	Navigation,
	useRootLoaderData,
	usePageLoaderData,
	MainNavigation,
} from '~/components';
import { allLanguages, getLanguage, logo } from '~/util';

const menus: { [code: string]: Menu[] } = {
	en: [
		{
			title: 'Getting Started',
			links: [
				{ title: 'Overview', to: '/' },
				{ title: 'Tutorial', to: '/tutorial' },
				{ title: 'Upgrading to v1', to: '/upgrading-v1' },
				{ title: 'GitHub', to: 'https://github.com/edmundhung/conform' },
			],
		},
		{
			title: 'Guides',
			links: [
				{ title: 'Validation', to: '/validation' },
				{ title: 'Nested object and Array', to: '/complex-structures' },
				{ title: 'Intent button', to: '/intent-button' },
				{ title: 'Accessibility', to: '/accessibility' },
				{ title: 'Checkbox and Radio Group', to: '/checkbox-and-radio-group' },
				{ title: 'File Upload', to: '/file-upload' },
			],
		},
		{
			title: 'Integration',
			links: [
				{ title: 'UI Libraries', to: '/integration/ui-libraries' },
				{ title: 'Remix', to: '/integration/remix' },
				{ title: 'Next.js', to: '/integration/nextjs' },
			],
		},
		{
			title: 'API Reference',
			links: [
				{ title: 'useForm', to: '/api/react/useForm' },
				{ title: 'useField', to: '/api/react/useField' },
				{ title: 'useFormMetadata', to: '/api/react/useFormMetadata' },
				{ title: 'useInputControl', to: '/api/react/useInputControl' },
				{ title: 'FormProvider', to: '/api/react/FormProvider' },
				{ title: 'FormStateInput', to: '/api/react/FormStateInput' },
			],
		},
		{
			title: 'Utilities',
			links: [
				{ title: 'getFormProps', to: '/api/react/getFormProps' },
				{ title: 'getFieldsetProps', to: '/api/react/getFieldsetProps' },
				{ title: 'getInputProps', to: '/api/react/getInputProps' },
				{ title: 'getSelectProps', to: '/api/react/getSelectProps' },
				{ title: 'getTextareaProps', to: '/api/react/getTextareaProps' },
				{ title: 'getCollectionProps', to: '/api/react/getCollectionProps' },
			],
		},
		{
			title: 'Schema related',
			links: [
				{ title: 'parseWithZod', to: '/api/zod/parseWithZod' },
				{ title: 'parseWithYup', to: '/api/yup/parseWithYup' },
				{ title: 'getZodConstraint', to: '/api/zod/getZodConstraint' },
				{ title: 'getYupConstraint', to: '/api/yup/getYupConstraint' },
			],
		},
	],
	ja: [
		{
			title: 'はじめに',
			links: [
				{ title: '概要', to: '/' },
				{ title: 'チュートリアル', to: '/tutorial' },
				{ title: 'v1 へのアップグレード', to: '/upgrading-v1' },
				{ title: 'GitHub', to: 'https://github.com/edmundhung/conform' },
			],
		},
		{
			title: 'ガイド',
			links: [
				{ title: 'バリデーション', to: '/validation' },
				{ title: 'ネストされたオブジェクトと配列', to: '/complex-structures' },
				{ title: 'インテントボタン', to: '/intent-button' },
				{ title: 'アクセシビリティ', to: '/accessibility' },
				{
					title: 'チェックボックスとラジオグループ',
					to: '/checkbox-and-radio-group',
				},
				{ title: 'ファイルのアップロード', to: '/file-upload' },
			],
		},
		{
			title: 'インテグレーション',
			links: [
				{ title: 'UI ライブラリ', to: '/integration/ui-libraries' },
				{ title: 'Remix', to: '/integration/remix' },
				{ title: 'Next.js', to: '/integration/nextjs' },
			],
		},
		{
			title: 'API リファレンス',
			links: [
				{ title: 'useForm', to: '/api/react/useForm' },
				{ title: 'useField', to: '/api/react/useField' },
				{ title: 'useFormMetadata', to: '/api/react/useFormMetadata' },
				{ title: 'useInputControl', to: '/api/react/useInputControl' },
				{ title: 'FormProvider', to: '/api/react/FormProvider' },
				{ title: 'FormStateInput', to: '/api/react/FormStateInput' },
			],
		},
		{
			title: 'ユーティリティ',
			links: [
				{ title: 'getFormProps', to: '/api/react/getFormProps' },
				{ title: 'getFieldsetProps', to: '/api/react/getFieldsetProps' },
				{ title: 'getInputProps', to: '/api/react/getInputProps' },
				{ title: 'getSelectProps', to: '/api/react/getSelectProps' },
				{ title: 'getTextareaProps', to: '/api/react/getTextareaProps' },
				{ title: 'getCollectionProps', to: '/api/react/getCollectionProps' },
			],
		},
		{
			title: 'スキーマ関連',
			links: [
				{ title: 'parseWithZod', to: '/api/zod/parseWithZod' },
				{ title: 'parseWithYup', to: '/api/yup/parseWithYup' },
				{ title: 'getZodConstraint', to: '/api/zod/getZodConstraint' },
				{ title: 'getYupConstraint', to: '/api/yup/getYupConstraint' },
			],
		},
	],
};

export function Guide({
	children,
}: {
	children: React.ReactNode;
}): React.ReactNode {
	const { owner, repo, ref, language } = useRootLoaderData();
	const { file, toc } = usePageLoaderData() ?? {};
	const location = useLocation();

	const sidemenus: Menu[] = [];

	if (toc && toc.links.length > 0) {
		sidemenus.push({
			title: 'On this page',
			links: toc.links.map((link) => ({
				title: link.title,
				to: `${location.pathname}${location.search}${link.to}`,
			})),
		});
	}

	if (file) {
		sidemenus.push({
			title: 'Related links',
			links: [
				{
					title: 'Edit this page',
					to: `https://github.com/${owner}/${repo}/edit/${ref}/${file}`,
				},
			],
		});
	}

	return (
		<div className="xl:container mx-auto xl:grid xl:grid-cols-5 gap-10 px-8 relative">
			<header className="bg-zinc-900 xl:bg-transparent sticky top-0 max-h-screen z-10 flex flex-col">
				<div className="py-6 xl:py-10 flex items-end justify-between">
					<Link
						className="font-mono inline-block text-[.20rem] leading-[.25rem] 2xl:text-[.3rem] 2xl:leading-[.3rem] whitespace-pre"
						title="Conform"
						to="/"
					>
						{logo}
					</Link>
					<select
						className="bg-zinc-900 text-xs rounded-md py-1 pl-1 pr-8"
						defaultValue={language.code}
						onChange={(e) => {
							const selectedLanguage = getLanguage(e.currentTarget.value);
							window.location.href = `//${selectedLanguage.domain}${location.pathname}${location.search}`;
						}}
					>
						{allLanguages.map(({ code, label }) => (
							<option key={code} value={code}>
								{label}
							</option>
						))}
					</select>
				</div>
				<MainNavigation menus={menus[language.code]} />
			</header>
			<main className="xl:col-span-3">{children}</main>
			<footer className="xl:col-span-1 top-0 sticky py-4 xl:flex xl:flex-col xl:h-screen -mx-8 px-8 mt-8 xl:mt-0 border-t xl:border-t-0 border-dotted">
				<div className="pt-2 pb-4 hidden xl:block xl:invisible">
					<button className="flex items-center justify-between w-full gap-4 px-2.5 py-2 rounded-sm border border-zinc-500 text-zinc-500 hover:text-zinc-400 hover:border-zinc-400">
						<div className="line-clamp-1 text-left">
							Type{' "'}
							<kbd className="text-white">/</kbd>
							{'" to search'}
						</div>
						<div className="-mt-1 rotate-45 text-2xl" aria-hidden>
							&#9906;
						</div>
					</button>
				</div>
				<div className="py-4 flex-1 xl:overflow-y-auto">
					<Navigation menus={sidemenus} />
				</div>
				<div className="py-4 text-sm">
					&copy; {new Date().getFullYear()} Edmund Hung
				</div>
			</footer>
		</div>
	);
}
