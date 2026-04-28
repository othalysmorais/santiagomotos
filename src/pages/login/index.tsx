import { useEffect, useState } from 'react'
import LogoImg from '../../assets/logo.png'
import { Container } from '../../components/container'
import { Link, useNavigate } from 'react-router-dom'

import { Input } from '../../components/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../../services/firebaseConnection'

import toast from 'react-hot-toast'

const MAX_ATTEMPTS = 5
const BLOCK_SECONDS = 30

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

    // FIX: proteção contra brute-force
    const [attempts, setAttempts] = useState(0)
    const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        async function handleLogout() {
            await signOut(auth)
        }
        handleLogout();
    }, [])

    useEffect(() => {
        if (!blockedUntil) return
        const interval = setInterval(() => {
            const remaining = Math.ceil((blockedUntil - Date.now()) / 1000)
            if (remaining <= 0) {
                setBlockedUntil(null)
                setCountdown(0)
                setAttempts(0)
            } else {
                setCountdown(remaining)
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [blockedUntil])

    const isBlocked = blockedUntil !== null && Date.now() < blockedUntil

    function onSubmit(data: FormData) {
        if (isBlocked) {
            toast.error(`Aguarde ${countdown} segundos para tentar novamente.`)
            return
        }

        signInWithEmailAndPassword(auth, data.email, data.password)
            .then(() => {
                setAttempts(0)
                toast.success("Login realizado com sucesso!")
                navigate('/dashboard', { replace: true })
            })
            .catch(() => {
                const next = attempts + 1
                setAttempts(next)
                if (next >= MAX_ATTEMPTS) {
                    setBlockedUntil(Date.now() + BLOCK_SECONDS * 1000)
                    toast.error(`Muitas tentativas falhas. Aguarde ${BLOCK_SECONDS} segundos.`)
                } else {
                    toast.error(`Email ou senha incorretos. Tentativa ${next}/${MAX_ATTEMPTS}.`)
                }
            })
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#141414] flex items-center justify-center px-4">
            <Container>
                <div className="w-full flex justify-center items-center flex-col gap-4">
                    <Link to="/" className="mb-2 w-45 bg-[#141414] rounded-3xl px-8 ">
                        <img className="w-full" src={LogoImg} alt="Logo WebCarros" />
                    </Link>

                    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-8 w-full max-w-md border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                            Entrar na sua conta
                        </h1>

                        {isBlocked && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
                                Acesso bloqueado temporariamente. Tente novamente em <strong>{countdown}s</strong>.
                            </div>
                        )}

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
                                disabled={isBlocked}
                                className="w-full h-11 rounded-xl bg-[#951620] hover:bg-[#7a1018] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors mt-2 cursor-pointer"
                            >
                                {isBlocked ? `Aguarde ${countdown}s` : 'Entrar'}
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
