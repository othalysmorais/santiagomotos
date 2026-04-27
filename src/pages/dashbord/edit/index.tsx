import { ChangeEvent, useState, useContext, useEffect } from "react"
import { Container } from "../../../components/container"
import { DashboardHeader } from "../../../components/painelheader"
import { useNavigate, useParams } from "react-router-dom"

import { FiUpload, FiTrash } from "react-icons/fi"
import { useForm } from "react-hook-form"
import { z } from 'zod'
import { Input } from "../../../components/input"
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthContext } from "../../../contexts/AuthContext"
import { v4 as uuidV4 } from 'uuid'

import { storage, db } from "../../../services/firebaseConnection"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { doc, getDoc, updateDoc } from "firebase/firestore"

import toast from "react-hot-toast"

const priceRegex = /^\d{1,3}(\.\d{3})*(,\d{2})$/

const schema = z.object({
    name: z.string().nonempty("O campo nome é obrigatório"),
    model: z.string().nonempty("O modelo da moto é obrigatório"),
    km: z.string().nonempty("O KM da moto é obrigatório"),
    year: z.string().nonempty("O Ano da moto é obrigatório"),
    price: z.string()
        .nonempty("O preço é obrigatório")
        .refine(val => priceRegex.test(val), { message: "Formato inválido. Ex: 20.111,00" }),
    city: z.string().nonempty("A cidade é obrigatória"),
    whatsapp: z.string().min(1, "O Telefone é obrigatório").refine((v) => /^(\d{11,12})$/.test(v), {
        message: "Número de telefone inválido"
    }),
    description: z.string().nonempty("A descrição é obrigatória")
})

type FormData = z.infer<typeof schema>

interface ImageItemProps {
    uid: string;
    name: string;
    previewUrl: string;
    url: string;
}

function formatCurrency(digits: string): string {
    if (!digits) return '';
    const cents = parseInt(digits, 10);
    if (isNaN(cents)) return '';
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatKm(digits: string): string {
    if (!digits) return '';
    const num = parseInt(digits, 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR');
}

export function EditCar() {
    const { id } = useParams()
    const { user } = useContext(AuthContext)
    const navigate = useNavigate()

    const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange"
    })

    const [carImages, setCarImages] = useState<ImageItemProps[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [priceDisplay, setPriceDisplay] = useState('')
    const [kmDisplay, setKmDisplay] = useState('')
    const [loading, setLoading] = useState(true)

    /* Carregar dados existentes */
    useEffect(() => {
        async function loadCar() {
            if (!id) return
            const docRef = doc(db, "cars", id)
            const snapshot = await getDoc(docRef)

            if (!snapshot.data()) { navigate("/dashboard"); return }

            const data = snapshot.data()!

            reset({
                name: data.name,
                model: data.model || '',
                km: data.km,
                year: data.year,
                price: data.price,
                city: data.city,
                whatsapp: String(data.whatsapp),
                description: data.description,
            })
            setPriceDisplay(data.price || '')
            setKmDisplay(data.km || '')

            setCarImages((data.images || []).map((img: { uid: string; name: string; url: string }) => ({
                uid: img.uid,
                name: img.name,
                previewUrl: img.url,
                url: img.url,
            })))
            setLoading(false)
        }
        loadCar()
    }, [id])

    function handlePriceChange(e: ChangeEvent<HTMLInputElement>) {
        const onlyDigits = e.target.value.replace(/\D/g, '')
        const formatted = formatCurrency(onlyDigits)
        setPriceDisplay(formatted)
        setValue('price', formatted, { shouldValidate: true })
    }

    function handleKmChange(e: ChangeEvent<HTMLInputElement>) {
        const onlyDigits = e.target.value.replace(/\D/g, '')
        const formatted = formatKm(onlyDigits)
        setKmDisplay(formatted)
        setValue('km', formatted, { shouldValidate: true })
    }

    async function handleFile(e: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        const invalid = files.filter(f => f.type !== "image/jpeg" && f.type !== "image/png")
        if (invalid.length > 0) { toast.error("Use apenas JPEG ou PNG."); return }
        for (const file of files) await handleUpload(file)
    }

    async function handleUpload(image: File) {
        if (!user?.uid) return
        setIsUploading(true)
        const uidImage = uuidV4()
        const previewUrl = URL.createObjectURL(image)
        const uploadRef = ref(storage, `images/${user.uid}/${uidImage}`)
        uploadBytes(uploadRef, image).then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadUrl) => {
                setCarImages(prev => [...prev, { name: uidImage, uid: uidImage, previewUrl, url: downloadUrl }])
                setIsUploading(false)
            })
        })
    }

    async function handleDeleteImage(item: ImageItemProps) {
        /* Só deleta do Storage se não for URL externa já salva */
        if (!item.previewUrl.startsWith('blob:')) {
            try {
                const imageRef = ref(storage, `images/${user?.uid}/${item.name}`)
                await deleteObject(imageRef)
            } catch { /* imagem pode já não existir */ }
        }
        setCarImages(prev => prev.filter(c => c.uid !== item.uid))
    }

    async function onSubmit(data: FormData) {
        if (carImages.length === 0) { toast.error("Envie pelo menos 1 imagem"); return }
        if (!id) return

        const docRef = doc(db, "cars", id)
        await updateDoc(docRef, {
            name: data.name.toUpperCase(),
            model: data.model,
            km: data.km,
            year: data.year,
            price: data.price,
            city: data.city,
            whatsapp: data.whatsapp,
            description: data.description,
            images: carImages.map(c => ({ uid: c.uid, name: c.name, url: c.url })),
        })
            .then(() => {
                toast.success("Moto atualizada com sucesso!")
                navigate("/dashboard")
            })
            .catch(() => toast.error("Erro ao atualizar. Tente novamente."))
    }

    if (loading) {
        return (
            <Container>
                <DashboardHeader />
                <div className="flex justify-center py-20 text-gray-400 dark:text-zinc-600">Carregando...</div>
            </Container>
        )
    }

    return (
        <Container>
            <DashboardHeader />

            {/* Fotos */}
            <div className="w-full bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm mb-4">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Fotos da moto</p>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="border-2 border-dashed border-gray-300 dark:border-zinc-600 hover:border-[#951620] dark:hover:border-[#951620] w-32 h-32 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors">
                        {isUploading ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400">Enviando...</span>
                        ) : (
                            <>
                                <FiUpload size={22} className="text-gray-400 mb-1" />
                                <span className="text-xs text-gray-400">Adicionar foto</span>
                            </>
                        )}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} disabled={isUploading} />
                    </label>

                    {carImages.map(item => (
                        <div key={item.uid} className="relative w-32 h-32 group">
                            <button
                                type="button"
                                className="absolute inset-0 z-10 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => handleDeleteImage(item)}
                            >
                                <FiTrash size={20} className="text-white" />
                            </button>
                            <img src={item.previewUrl} alt="Foto" className="w-32 h-32 rounded-xl object-cover border border-gray-200 dark:border-zinc-700" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Formulário */}
            <div className="w-full bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-5">Informações da moto</p>
                <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome da Moto</label>
                        <Input type="text" register={register} name="name" error={errors.name?.message} placeholder="Ex: Onix 1.0" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Modelo</label>
                        <Input type="text" register={register} name="model" error={errors.model?.message} placeholder="Ex: 1.0 Flex PLUS MANUAL" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ano</label>
                            <Input type="text" register={register} name="year" error={errors.year?.message} placeholder="Ex: 2020/2020" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">KM rodados</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={kmDisplay}
                                onChange={handleKmChange}
                                placeholder="Ex: 20.000"
                                className="w-full border-2 border-gray-200 dark:border-zinc-700 rounded-lg h-11 px-3 outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:border-[#951620] dark:focus:border-[#951620] transition-colors"
                            />
                            {errors.km && <p className="mt-1 text-[#951620] text-sm">{errors.km.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">WhatsApp</label>
                            <Input type="text" register={register} name="whatsapp" error={errors.whatsapp?.message} placeholder="Ex: 011996642819" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cidade</label>
                            <Input type="text" register={register} name="city" error={errors.city?.message} placeholder="Ex: São Paulo - SP" />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Preço</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium pointer-events-none select-none">R$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={priceDisplay}
                                onChange={handlePriceChange}
                                placeholder="0,00"
                                className="w-full border-2 border-gray-200 dark:border-zinc-700 rounded-lg h-11 pl-10 pr-3 outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-[#951620] dark:focus:border-[#951620] transition-colors"
                            />
                        </div>
                        {errors.price && <p className="mt-1 text-[#951620] text-sm">{errors.price.message}</p>}
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição</label>
                        <textarea
                            className="border-2 border-gray-200 dark:border-zinc-700 w-full rounded-lg h-28 px-3 py-2 outline-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-[#951620] dark:focus:border-[#951620] transition-colors resize-none text-sm"
                            {...register("description")}
                            placeholder="Descreva o estado do moto, acessórios, revisões..."
                        />
                        {errors.description && <p className="mt-1 text-[#951620] text-sm">{errors.description.message}</p>}
                    </div>
                    <button type="submit" className="w-full h-11 rounded-xl bg-[#951620] hover:bg-[#7a1018] text-white font-semibold transition-colors cursor-pointer">
                        Salvar alterações
                    </button>
                </form>
            </div>
        </Container>
    )
}
