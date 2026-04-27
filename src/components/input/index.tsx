import { RegisterOptions, UseFormRegister } from "react-hook-form";

interface InputProps {
    type: string;
    placeholder: string;
    name: string;
    register: UseFormRegister<any>;
    error?: string;
    rules?: RegisterOptions;
}

export function Input({ name, placeholder, type, register, error, rules }: InputProps) {
    return (
        <div>
            <input
                className="w-full border-2 border-gray-200 dark:border-zinc-700 rounded-lg h-11 px-3 outline-none bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:border-[#951620] dark:focus:border-[#951620] transition-colors"
                placeholder={placeholder}
                type={type}
                {...register(name, rules)}
                id={name}
            />
            {error && <p className="mt-1 text-[#951620] text-sm">{error}</p>}
        </div>
    )
}
