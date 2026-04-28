import { Link } from 'react-router-dom'

export function NotFound() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#141414] flex flex-col items-center justify-center px-4 text-center">
            <p className="text-8xl font-black text-[#951620] mb-4">404</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Página não encontrada</h1>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-8">
                O endereço que você tentou acessar não existe.
            </p>
            <Link
                to="/"
                className="px-6 h-11 flex items-center rounded-xl bg-[#951620] hover:bg-[#7a1018] text-white font-semibold transition-colors"
            >
                Voltar ao catálogo
            </Link>
        </div>
    )
}
