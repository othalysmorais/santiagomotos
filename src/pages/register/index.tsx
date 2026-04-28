import { useEffect, useContext } from 'react'
import LogoImg from '../../assets/logo.svg'
import { Container } from '../../components/container'
import { Link, useNavigate } from 'react-router-dom'

import { Input } from '../../components/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { auth } from '../../services/firebaseConnection'
import { createUserWithEmailAndPassword, updateProfile, signOut, sendEmailVerification } from 'firebase/auth'
import { AuthContext } from '../../contexts/AuthContext'

import toast from 'react-hot-toast'

const schema = z.object({
    name: z.string().nonempty("O campo nome é obrigatório"),
    email: z.string().email("Insira um email válido").nonempty("O campo é obrigatório"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").nonempty("O campo senha é obrigatório")
})

type FormData = z.infer<typeof schema>

export function Register() {
    const { handleInfoUser } = useContext(AuthContext)
    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange"
    })

    useEffect(() => {
        async function handleLogout() {
            await signOut(auth)
        }
        handleLogout();
    }, [])

    async function onSubmit(data: FormData) {
        createUserWithEmailAndPassword(auth, data.email, data.password)
            .then(async (userCredential) => {
                await updateProfile(userCredential.user, { displayName: data.name })

                // FIX: envia e-mail de verificação ao criar conta
                await sendEmailVerification(userCredential.user)

                handleInfoUser({
                    name: data.name,
                    email: data.email,
                    uid: userCredential.user.uid
                })

                toast.success("Conta criada! Verifique seu e-mail antes de continuar.")
                navigate('/dashboard', { replace: true })
            })
            .catch(() => {
                // FIX: removido console.log que expunha detalhes internos do Firebase
                toast.error('Erro ao criar conta. Tente novamente.')
            })
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#141414] flex items-center justify-center px-4">
            <Container>
                <div className="w-full flex justify-center items-center flex-col gap-4">
                    <Link to="/" className="mb-2 w-40">
                        <img className="w-full" src={LogoImg} alt="Logo WebCarros" />
                    </Link>

                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-8 w-full max-w-md border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                            Criar uma conta
                        </h1>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Nome completo
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Seu nome"
                                    name="name"
                                    error={errors.name?.message}
                                    register={register}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    name="email"
                                    error={errors.email?.message}
                                    register={register}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Senha
                                </label>
                                <Input
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    name="password"
                                    error={errors.password?.message}
                                    register={register}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full h-11 rounded-xl bg-[#951620] hover:bg-[#7a1018] text-white font-semibold transition-colors mt-2 cursor-pointer"
                            >
                                Criar conta
                            </button>
                        </form>
                    </div>

                    <Link
                        to="/login"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#951620] dark:hover:text-[#951620] transition-colors"
                    >
                        Já tem uma conta? <span className="font-semibold">Faça login</span>
                    </Link>
                </div>
            </Container>
        </div>
    )
}
