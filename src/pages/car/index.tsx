import { useEffect, useState, useCallback } from "react"
import { Container } from '../../components/container'
import { FaWhatsapp } from "react-icons/fa"
import { FiMapPin } from "react-icons/fi"
import { BsCalendar3, BsSpeedometer2, BsGear } from "react-icons/bs"
import { useNavigate, useParams } from "react-router-dom"
import { getDoc, doc } from "firebase/firestore"
import { db } from "../../services/firebaseConnection"
import { Swiper, SwiperSlide } from "swiper/react"

interface CarProps {
    id: string;
    name: string;
    model: string;
    city: string;
    year: string;
    km: string;
    description: string;
    created: string;
    owner: string | number;
    uid: string;
    whatsapp: number;
    price: string | number;
    images: ImageCarProps[];
}

interface ImageCarProps {
    uid: string;
    name: string;
    url: string;
}

interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

function StatItem({ icon, label, value }: StatItemProps) {
    return (
        <div className="flex items-start gap-3">
            <div className="text-[#951620] mt-0.5 shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-0.5">{label}</p>
                <strong className="text-gray-900 dark:text-white text-sm font-bold">{value}</strong>
            </div>
        </div>
    )
}

// FIX: mascara o número para dificultar scraping automatizado
function maskPhone(num: string | number): string {
    const s = String(num).replace(/\D/g, '')
    if (s.length < 10) return '***'
    const ddd = s.slice(0, 2)
    const last4 = s.slice(-4)
    return `(${ddd}) ****-${last4}`
}

export function CarDetail() {
    const { id } = useParams()
    const [car, setCar] = useState<CarProps>()
    const [phoneRevealed, setPhoneRevealed] = useState(false)
    const [sliderPerView, setSliderPerview] = useState<number>(2);
    const navigate = useNavigate()

    const revealPhone = useCallback(() => setPhoneRevealed(true), [])

    useEffect(() => {
        async function loadCar() {
            if (!id) return;
            const docRef = doc(db, "cars", id)
            getDoc(docRef).then((snapshot) => {
                if (!snapshot.data()) { navigate("/") }
                setCar({
                    id: snapshot.id,
                    name: snapshot.data()?.name,
                    year: snapshot.data()?.year,
                    city: snapshot.data()?.city,
                    model: snapshot.data()?.model || '',
                    km: snapshot.data()?.km,
                    description: snapshot.data()?.description,
                    created: snapshot.data()?.created,
                    owner: snapshot.data()?.owner,
                    uid: snapshot.data()?.uid,
                    whatsapp: snapshot.data()?.whatsapp,
                    images: snapshot.data()?.images,
                    price: snapshot.data()?.price,
                })
            })
        }
        loadCar()
    }, [id])

    useEffect(() => {
        function handleResize() {
            setSliderPerview(window.innerWidth < 720 ? 1 : 2);
        }
        handleResize();
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const card = "bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm mb-4"

    return (
        <Container>
            {/* Gallery */}
            <div className={`${card} overflow-hidden`}>
                <Swiper slidesPerView={sliderPerView} pagination={{ clickable: true }} navigation>
                    {car?.images.map(image => (
                        <SwiperSlide key={image.name}>
                            <img src={image.url} className="w-full h-80 object-cover" alt={car.name} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {car && (
                <>
                    {/* Nome + Preço */}
                    <div className={`${card} p-5`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h1 className="font-bold text-2xl text-gray-900 dark:text-white">{car.name}</h1>
                                {car.model && (
                                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{car.model}</p>
                                )}
                            </div>
                            <span className="text-3xl font-bold text-[#951620] whitespace-nowrap">
                                R$ {car.price}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500 dark:text-zinc-400">
                            <FiMapPin size={14} className="text-[#951620]" />
                            {car.city}
                        </div>
                    </div>

                    {/* Características */}
                    <div className={`${card} p-5`}>
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-5">Características</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                            <StatItem
                                icon={<BsCalendar3 size={22} />}
                                label="Ano"
                                value={car.year}
                            />
                            <StatItem
                                icon={<BsSpeedometer2 size={24} />}
                                label="Quilometragem"
                                value={`${car.km} km`}
                            />
                            {car.model && (
                                <StatItem
                                    icon={<BsGear size={22} />}
                                    label="Modelo"
                                    value={car.model}
                                />
                            )}
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className={`${card} p-5`}>
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Descrição</h2>
                        <p className="text-gray-600 dark:text-zinc-400 leading-relaxed text-sm whitespace-pre-line">
                            {car.description}
                        </p>
                    </div>

                    {/* Contato */}
                    <div className={`${card} p-5`}>
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Telefone / WhatsApp</h2>
                        {/* FIX: número mascarado por padrão, revelado ao clicar */}
                        <div className="flex items-center gap-3 mb-4">
                            <p className="text-gray-500 dark:text-zinc-400 text-sm">
                                {phoneRevealed ? car.whatsapp : maskPhone(car.whatsapp)}
                            </p>
                            {!phoneRevealed && (
                                <button
                                    onClick={revealPhone}
                                    className="text-xs text-[#951620] hover:underline font-medium"
                                >
                                    Revelar número
                                </button>
                            )}
                        </div>
                        <a
                            href={`https://api.whatsapp.com/send?phone=${car.whatsapp}&text=Ol%C3%A1%2C+vi+essa+${encodeURIComponent(car.name)}+e+fiquei+interessado!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 hover:bg-green-600 w-full text-white flex items-center justify-center gap-2 rounded-xl h-12 text-base font-semibold transition-colors"
                        >
                            Falar com o vendedor
                            <FaWhatsapp size={22} />
                        </a>
                    </div>
                </>
            )}
        </Container>
    )
}
