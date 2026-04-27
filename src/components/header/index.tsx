import { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { FiLogIn, FiUser, FiSun, FiMoon, FiSearch } from 'react-icons/fi';

export function Header() {
    const { signed, loadingAuth } = useContext(AuthContext);
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        navigate(`/?q=${encodeURIComponent(search.trim())}`);
    }

    /* Botões de ícone — sempre escuros, mesma aparência */
    const iconBtn =
        'w-10 h-10 rounded-full bg-[#3d3d3d] dark:bg-[#1e1e1e] hover:bg-[#951620] border border-[#505050] dark:border-[#2d2d2d] flex items-center justify-center text-gray-200 transition-all duration-200 shrink-0';

    return (
        /* Header sempre escuro — cor da logo */
        <div className="w-full sticky top-0 z-50 bg-[#2d2d2d] dark:bg-[#111111] border-b-2 border-[#951620] shadow-lg">
            <header className="flex w-full max-w-7xl items-center gap-4 px-4 mx-auto h-16">
                {/* Logo */}
                <Link to="/" className="shrink-0">
                    <img src={logo} alt="WebCarros" className="w-28 h-auto rounded-lg" />
                </Link>

                {/* Search */}
                <form
                    onSubmit={handleSearch}
                    className="flex flex-1 items-center gap-2 bg-[#3d3d3d] dark:bg-[#1a1a1a] rounded-xl px-3 h-10 border border-[#505050] dark:border-[#2a2a2a] focus-within:border-[#951620] transition-colors"
                >
                    <FiSearch size={16} className="text-gray-400 shrink-0" />
                    <input
                        className="flex-1 bg-transparent outline-none text-sm text-gray-100 placeholder-gray-500"
                        placeholder="Busque por marca ou modelo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                {/* Nav links */}
                <nav className="hidden sm:flex items-center gap-1 shrink-0">
                    
                    {!loadingAuth && signed && (
                        <Link
                            to="/dashboard/new"
                            className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
                        >
                            Anunciar
                        </Link>
                    )}
                </nav>

                {/* Icon buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={toggleTheme} className={iconBtn} aria-label="Alternar tema">
                        {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
                    </button>

                    {!loadingAuth && signed && (
                        <Link to="/dashboard" className={iconBtn}>
                            <FiUser size={18} />
                        </Link>
                    )}
                    {!loadingAuth && !signed && (
                        <Link to="/login" className={iconBtn}>
                            <FiLogIn size={18} />
                        </Link>
                    )}
                </div>
            </header>
        </div>
    );
}
