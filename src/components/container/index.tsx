import type { ReactNode } from "react"

export function Container({ children }: { children: ReactNode }) {
    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {children}
        </div>
    )
}
