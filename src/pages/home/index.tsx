import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "../../components/container";
import { FiMapPin, FiFilter, FiX, FiChevronDown } from "react-icons/fi";
import { BsCalendar3, BsSpeedometer2 } from "react-icons/bs";

import {
    collection,
    query,
    getDocs,
    orderBy,
    where,
} from "firebase/firestore";
import { db } from "../../services/firebaseConnection";

interface CarProps {
    id: string;
    name: string;
    model: string;
    year: string;
    price: string;
    city: string;
    km: string;
    images: CarImageProps[];
    uid: string;
}

interface CarImageProps {
    name: string;
    url: string;
    uid: string;
}

type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'km_asc';

/* Converte "20.111,00" → 20111 para comparação */
function parsePrice(val: string): number {
    return Number(val.replace(/\./g, '').replace(',', '.')) || 0;
}

/* Classes reutilizáveis de filtro */
const fi = "w-full border border-gray-300 dark:border-zinc-700 rounded-lg h-9 px-2 text-xs outline-none bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-[#951620] dark:focus:border-[#951620] transition-colors";
const fs = "w-full appearance-none border border-gray-300 dark:border-zinc-700 rounded-lg h-9 px-3 text-xs outline-none bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 focus:border-[#951620] dark:focus:border-[#951620] transition-colors cursor-pointer";

export function Home() {
    const [searchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') || '';

    const [cars, setCars] = useState<CarProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadedImages, setLoadedImages] = useState<string[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('recent');

    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [kmMin, setKmMin] = useState('');
    const [kmMax, setKmMax] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [yearMin, setYearMin] = useState('');
    const [yearMax, setYearMax] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedModel, setSelectedModel] = useState('');

    useEffect(() => {
        setLoadedImages([]);
        setLoading(true);
        const fn = urlQuery ? searchByName(urlQuery) : loadAllCars();
        fn.finally(() => setLoading(false));
    }, [urlQuery]);

    async function loadAllCars() {
        const q = query(collection(db, "cars"), orderBy("created", "desc"));
        const snap = await getDocs(q);
        setCars(snap.docs.map(d => ({
            id: d.id, name: d.data().name, model: d.data().model || '',
            year: d.data().year, price: d.data().price, city: d.data().city,
            km: d.data().km, images: d.data().images, uid: d.data().uid,
        })));
    }

    async function searchByName(name: string) {
        const q = query(collection(db, "cars"),
            where("name", ">=", name.toUpperCase()),
            where("name", "<=", name.toUpperCase() + "\uf8ff"));
        const snap = await getDocs(q);
        setCars(snap.docs.map(d => ({
            id: d.id, name: d.data().name, model: d.data().model || '',
            year: d.data().year, price: d.data().price, city: d.data().city,
            km: d.data().km, images: d.data().images, uid: d.data().uid,
        })));
    }

    const uniqueCities = useMemo(
        () => [...new Set(cars.map(c => c.city).filter(Boolean))].sort(),
        [cars]
    );

    /* Marca = primeira palavra do name (ex: "HONDA CB500" → "HONDA") */
    const uniqueBrands = useMemo(
        () => [...new Set(cars.map(c => c.name?.split(' ')[0]).filter(Boolean))].sort(),
        [cars]
    );

    /* Modelos filtrados pela marca selecionada */
    const uniqueModels = useMemo(() => {
        const source = selectedBrand
            ? cars.filter(c => c.name?.startsWith(selectedBrand))
            : cars;
        return [...new Set(source.map(c => c.model).filter(Boolean))].sort();
    }, [cars, selectedBrand]);

    const hasActiveFilters = !!(priceMin || priceMax || kmMin || kmMax || selectedCity || yearMin || yearMax || selectedBrand || selectedModel);

    function clearFilters() {
        setPriceMin(''); setPriceMax('');
        setKmMin(''); setKmMax('');
        setSelectedCity('');
        setYearMin(''); setYearMax('');
        setSelectedBrand(''); setSelectedModel('');
    }

    const displayedCars = useMemo(() => {
        let result = cars.filter(car => {
            const price = parsePrice(car.price);
            const km = Number(car.km) || 0;
            const year = Number(car.year?.split('/')[0]) || 0;
            if (priceMin && price < parsePrice(priceMin)) return false;
            if (priceMax && price > parsePrice(priceMax)) return false;
            if (kmMin && km < Number(kmMin)) return false;
            if (kmMax && km > Number(kmMax)) return false;
            if (selectedCity && car.city !== selectedCity) return false;
            if (yearMin && year < Number(yearMin)) return false;
            if (yearMax && year > Number(yearMax)) return false;
            if (selectedBrand && !car.name?.startsWith(selectedBrand)) return false;
            if (selectedModel && car.model !== selectedModel) return false;
            return true;
        });

        if (sortBy === 'price_asc') result = [...result].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        if (sortBy === 'price_desc') result = [...result].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        if (sortBy === 'km_asc') result = [...result].sort((a, b) => Number(a.km) - Number(b.km));

        return result;
    }, [cars, priceMin, priceMax, kmMin, kmMax, selectedCity, yearMin, yearMax, selectedBrand, selectedModel, sortBy]);

    /* ── Sidebar ── */
    const filterSidebar = (
        <aside>
            <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 dark:text-white text-base">Filtros</h2>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-[#951620] hover:underline">
                        <FiX size={13} /> Limpar
                    </button>
                )}
            </div>

            {/* Marca */}
            <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Marca</p>
                <div className="relative">
                    <select
                        value={selectedBrand}
                        onChange={e => { setSelectedBrand(e.target.value); setSelectedModel(''); }}
                        className={fs}
                    >
                        <option value="">Todas as marcas</option>
                        {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <FiChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Modelo */}
            <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Modelo</p>
                <div className="relative">
                    <select
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        className={fs}
                        disabled={uniqueModels.length === 0}
                    >
                        <option value="">Todos os modelos</option>
                        {uniqueModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <FiChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Faixa de Preço</p>
                <div className="flex gap-2">
                    <input type="number" placeholder="Mínimo" value={priceMin} onChange={e => setPriceMin(e.target.value)} className={fi} />
                    <input type="number" placeholder="Máximo" value={priceMax} onChange={e => setPriceMax(e.target.value)} className={fi} />
                </div>
            </div>

            <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Quilometragem</p>
                <div className="flex gap-2">
                    <input type="number" placeholder="Mínimo" value={kmMin} onChange={e => setKmMin(e.target.value)} className={fi} />
                    <input type="number" placeholder="Máximo" value={kmMax} onChange={e => setKmMax(e.target.value)} className={fi} />
                </div>
            </div>

            <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Ano</p>
                <div className="flex gap-2">
                    <input type="number" placeholder="De" value={yearMin} onChange={e => setYearMin(e.target.value)} className={fi} />
                    <input type="number" placeholder="Até" value={yearMax} onChange={e => setYearMax(e.target.value)} className={fi} />
                </div>
            </div>

            {uniqueCities.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Localização</p>
                    <div className="relative">
                        <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className={fs}>
                            <option value="">Todas as cidades</option>
                            {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                        <FiChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            )}
        </aside>
    );

    return (
        <Container>
            <div className="flex gap-6">
                {/* Sidebar desktop */}
                <div className="hidden lg:block w-60 shrink-0">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 border border-gray-200 dark:border-zinc-800 shadow-sm sticky top-24">
                        {filterSidebar}
                    </div>
                </div>

                {/* Main */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h1 className="font-bold text-2xl text-gray-900 dark:text-white">
                                {urlQuery ? `Resultados para "${urlQuery}"` : 'Catálogo de Motos'}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5">
                                {displayedCars.length} {displayedCars.length === 1 ? 'veículo encontrado' : 'veículos encontrados'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden flex items-center gap-2 border border-gray-300 dark:border-zinc-700 rounded-xl px-3 h-9 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e1e1e] hover:border-[#951620] transition-colors"
                            >
                                <FiFilter size={14} />
                                Filtros
                                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#951620]" />}
                            </button>

                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as SortOption)}
                                    className="appearance-none border border-gray-300 dark:border-zinc-700 rounded-xl h-9 pl-3 pr-8 text-sm outline-none bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 focus:border-[#951620] transition-colors cursor-pointer"
                                >
                                    <option value="recent">Mais recentes</option>
                                    <option value="price_asc">Menor Preço</option>
                                    <option value="price_desc">Maior Preço</option>
                                    <option value="km_asc">Menor KM</option>
                                </select>
                                <FiChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm">
                                    <div className="w-full h-48 bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-3/4" />
                                        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-1/2" />
                                        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse w-1/3 mt-2" />
                                        <div className="h-9 bg-gray-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : displayedCars.length > 0 ? (
                        <main className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {displayedCars.map(car => (
                                <article
                                    key={car.id}
                                    className="bg-white dark:bg-[#1e1e1e] rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group flex flex-col"
                                >
                                    <div className="relative w-full h-48 bg-gray-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                                        <div
                                            className="w-full h-full bg-gray-200 dark:bg-zinc-800 animate-pulse"
                                            style={{ display: loadedImages.includes(car.id) ? "none" : "block" }}
                                        />
                                        <img
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                            src={car.images[0].url}
                                            alt={car.name}
                                            onLoad={() => setLoadedImages(prev => [...prev, car.id])}
                                            style={{ display: loadedImages.includes(car.id) ? "block" : "none" }}
                                        />
                                    </div>

                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 leading-snug">
                                            {car.name}
                                        </h3>

                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-500 mb-1.5">
                                            <span className="flex items-center gap-1">
                                                <BsCalendar3 size={11} />
                                                {car.year}
                                            </span>
                                            <span className="text-gray-300 dark:text-zinc-700">·</span>
                                            <span className="flex items-center gap-1">
                                                <BsSpeedometer2 size={12} />
                                                {car.km} km
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-500 mb-3">
                                            <FiMapPin size={11} className="shrink-0 text-[#951620]" />
                                            <span className="truncate">{car.city}</span>
                                        </div>

                                        <div className="mt-auto">
                                            <p className="text-xl font-bold text-[#951620] mb-3">
                                                R$ {car.price}
                                            </p>
                                            <Link
                                                to={`/car/${car.id}`}
                                                className="block w-full bg-[#951620] hover:bg-[#7a1018] text-white text-sm font-semibold text-center py-2.5 rounded-xl transition-colors"
                                            >
                                                Ver Detalhes
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </main>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-600">
                            <p className="text-lg font-medium">Nenhum veículo encontrado</p>
                            <p className="text-sm mt-1">Tente ajustar os filtros ou buscar outro modelo</p>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="mt-4 text-sm text-[#951620] hover:underline">
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#1e1e1e] p-5 overflow-y-auto shadow-2xl border-r border-gray-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-bold text-gray-900 dark:text-white">Filtros</span>
                            <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white">
                                <FiX size={20} />
                            </button>
                        </div>
                        {filterSidebar}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="w-full mt-4 bg-[#951620] hover:bg-[#7a1018] text-white font-semibold py-2.5 rounded-xl transition-colors"
                        >
                            Ver {displayedCars.length} resultados
                        </button>
                    </div>
                </div>
            )}
        </Container>
    );
}
