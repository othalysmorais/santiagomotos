import { useEffect, useState, useContext } from 'react'
import { Container } from "../../components/container";
import { DashboardHeader } from '../../components/painelheader'
import { FiTrash2, FiMapPin, FiEdit2 } from 'react-icons/fi'

import { collection, getDocs, where, query, doc, deleteDoc } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db, storage } from '../../services/firebaseConnection'
import { ref, deleteObject } from 'firebase/storage';
import { AuthContext } from '../../contexts/AuthContext'

interface CarProps {
    id: string;
    name: string;
    year: string;
    price: string | number;
    city: string;
    km: string;
    images: ImageCarProps[];
    uid: string;
}

interface ImageCarProps {
    name: string;
    uid: string;
    url: string;
}

export function Dashboard() {
    const [cars, setCars] = useState<CarProps[]>([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        function loadCars() {
            if (!user?.uid) return;

            const carsRef = collection(db, "cars")
            const queryRef = query(carsRef, where("uid", "==", user.uid))

            getDocs(queryRef).then((snapshot) => {
                const listcars: CarProps[] = [];
                snapshot.forEach(doc => {
                    listcars.push({
                        id: doc.id,
                        name: doc.data().name,
                        year: doc.data().year,
                        km: doc.data().km,
                        city: doc.data().city,
                        price: doc.data().price,
                        images: doc.data().images,
                        uid: doc.data().uid
                    })
                })
                setCars(listcars);
            })
        }
        loadCars();
    }, [user])

    async function handleDeleteCar(car: CarProps) {
        const docRef = doc(db, "cars", car.id)
        await deleteDoc(docRef);

        car.images.map(async (image) => {
            const imagePath = `images/${car.uid}/${image.name}`
            const imageRef = ref(storage, imagePath)
            try {
                await deleteObject(imageRef)
            } catch (err) {
                console.log("Erro ao excluir essa imagem")
            }
        })
        setCars(cars.filter(item => item.id !== car.id))
    }

    return (
        <Container>
            <DashboardHeader />

            {cars.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-600">
                    <p className="text-lg font-medium">Nenhuma moto cadastrada</p>
                    <p className="text-sm mt-1">Clique em "Nova Moto" para adicionar</p>
                </div>
            ) : (
                <main className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {cars.map(car => (
                        <section
                            key={car.id}
                            className="w-full bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm relative group"
                        >
                            <div className="absolute top-2 right-2 z-10 flex gap-1.5">
                                <Link
                                    to={`/dashboard/edit/${car.id}`}
                                    className="bg-white dark:bg-zinc-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:bg-[#951620] hover:text-white text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-zinc-700"
                                >
                                    <FiEdit2 size={15} />
                                </Link>
                                <button
                                    onClick={() => handleDeleteCar(car)}
                                    className="bg-white dark:bg-zinc-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:bg-[#951620] hover:text-white text-gray-700 dark:text-gray-300 transition-colors cursor-pointer border border-gray-200 dark:border-zinc-700"
                                >
                                    <FiTrash2 size={15} />
                                </button>
                            </div>

                            <img
                                className="w-full max-h-52 object-cover"
                                src={car.images[0].url}
                                alt={car.name}
                            />

                            <div className="p-4">
                                <p className="font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">{car.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    {car.year} &bull; {car.km} km
                                </p>
                                <p className="text-lg font-bold text-[#951620] mb-3">
                                    R$ {car.price}
                                </p>
                                <div className="border-t border-gray-200 dark:border-zinc-800 pt-3 flex items-center gap-1.5">
                                    <FiMapPin size={13} className="text-gray-400 shrink-0" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{car.city}</span>
                                </div>
                            </div>
                        </section>
                    ))}
                </main>
            )}
        </Container>
    )
}
