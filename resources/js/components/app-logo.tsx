import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                <AppLogoIcon className="size-5 text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    CrewBunker
                </span>
                <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Field CRM & Dispatch
                </span>
            </div>
        </>
    );
}
