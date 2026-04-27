import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebaseConnection'
import { FiGrid, FiPlusCircle, FiLogOut } from 'react-icons/fi'

export function DashboardHeader() {

    async function handleLogout() {
        await signOut(auth)
    }

    return (
        <div className="w-full flex items-center h-12 bg-[#951620] rounded-xl text-white font-medium gap-1 px-4 mb-6 shadow-sm">
            <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/15 transition-colors text-sm"
            >
                <FiGrid size={15} />
                Dashboard
            </Link>

            <Link
                to="/dashboard/new"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/15 transition-colors text-sm"
            >
                <FiPlusCircle size={15} />
                Nova Moto
            </Link>

            <button
                className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/15 transition-colors text-sm cursor-pointer"
                onClick={handleLogout}
            >
                <FiLogOut size={15} />
                Sair
            </button>
        </div>
    )
}
