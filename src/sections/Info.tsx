import { ArrowPathIcon, CloudArrowUpIcon, FingerPrintIcon, LockClosedIcon } from '@heroicons/react/24/outline'

const features = [
    {
        name: 'GitHub-native onboarding',
        description:
            'Connect a repo with OAuth and we automatically crawl the codebase, build a structured feature map, and keep it in sync with every push—no local setup, no terminal.',
        icon: CloudArrowUpIcon,
    },
    {
        name: 'Explainable feature graph',
        description:
            'We turn files and folders into an interactive feature map with readable summaries, dependencies, and associated files so vibecoders can see how everything fits together.',
        icon: ArrowPathIcon,
    },
    {
        name: 'Natural language code editing',
        description:
            'Ask for changes in a Gemini-powered chat (“add a settings page”, “refactor auth flow”) and the agent gathers context, edits code, and opens commits directly in GitHub.',
        icon: FingerPrintIcon,
    },
    {
        name: 'Secure, auditable workflow',
        description:
            'GitHub OAuth, scoped tokens, and Step Functions keep every AI action logged, allowing users to trace exactly which files were read, changed, and committed.',
        icon: LockClosedIcon,
    },
]

export default function Info() {
    return (
        <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base/7 font-semibold text-indigo-400">
                        Agentic workflow for vibecoding
                    </h2>
                    <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl lg:text-balance">
                        Understand and evolve any codebase in minutes
                    </p>
                    <p className="mt-6 text-lg/8 text-gray-300">
                        This app turns a GitHub repository into an interactive feature map created by an
                        AI agent. Non-programmers can explore how the system works, ask questions about the codebase,
                        and trigger auditable code changes without touching an IDE
                        or learning git. We use a full end-to-end agentic workflow:
                        GitHub OAuth, AWS Amplify, Step Functions, and Gemini all working together.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                        {features.map((feature) => (
                            <div key={feature.name} className="relative pl-16">
                                <dt className="text-base/7 font-semibold text-white">
                                    <div className="absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg bg-indigo-500">
                                        <feature.icon aria-hidden="true" className="size-6 text-white" />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="mt-2 text-base/7 text-gray-400">{feature.description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    )
}