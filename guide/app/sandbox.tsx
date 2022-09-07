interface SandboxProps {
	title: string;
	path: string;
}

export function Sandbox({ title, path }: SandboxProps) {
	return (
		<iframe
			title={title}
			src={`https://codesandbox.io/embed/github/${path}?editorsize=60`}
			className="my-10 w-full aspect-[16/9] outline outline-zinc-800 outline-offset-4"
			sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
		/>
	);
}
