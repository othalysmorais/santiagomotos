import { useEffect } from 'react'
import LogoImg from '../../assets/logo.svg'
import { Container } from '../../components/container'
import { Link, useNavigate } from 'react-router-dom'

import { Input } from '../../components/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../../services/firebaseConnection'

import toast from 'react-hot-toast'

const schema = z.object({
    email: z.string().email("Insira um email válido").nonempty("O campo é obrigatório"),
    password: z.string().nonempty("O campo senha é obrigatório")
})

type FormData = z.infer<typeof schema>

export function Login() {
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

    function onSubmit(data: FormData) {
        signInWithEmailAndPassword(auth, data.email, data.password)
            .then(() => {
                toast.success("Login realizado com sucesso!")
                navigate('/dashboard', { replace: true })
            })
            .catch(() => {
                toast.error('Email ou senha incorretos')
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
                            Entrar na sua conta
                        </h1>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                                    placeholder="••••••••"
                                    name="password"
                                    error={errors.password?.message}
                                    register={register}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full h-11 rounded-xl bg-[#951620] hover:bg-[#7a1018] text-white font-semibold transition-colors mt-2 cursor-pointer"
                            >
                                Entrar
                            </button>
                        </form>
                    </div>

                    <Link
                        to="/register"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#951620] dark:hover:text-[#951620] transition-colors"
                    >
                        Não tem uma conta? <span className="font-semibold">Cadastre-se</span>
                    </Link>
                </div>
            </Container>
        </div>
    )
}
