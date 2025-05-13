"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "@/lib/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Token inválido ou ausente. Redirecionando para login...", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      setTimeout(() => router.push("/"), 3000);
    }
  }, [token, router]);

  const validateForm = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    const passwordRegex =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~/-]).{6,50}$/;

    if (!password) {
      newErrors.password = "Nova senha é obrigatória";
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "Senha deve ter 6-50 caracteres, com letras, números e símbolos";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Por favor, corrija os erros no formulário", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !token) return;

    setIsLoading(true);
    try {
      await api({
        method: "POST",
        url: "/auth/reset-password",
        data: { token, password },
      });

      toast.success(
        "Senha redefinida com sucesso! Redirecionando para login...",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        }
      );

      setTimeout(() => router.push("/"), 3000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Erro ao redefinir a senha. Token inválido ou expirado.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      console.error(err);
      if (
        errorMessage.includes("Token inválido") ||
        errorMessage.includes("expirado")
      ) {
        setTimeout(() => router.push("/"), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  if (!token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans bg-[#1f2937] py-8">
      <Image
        src="/background.png"
        alt="Background"
        fill
        className="object-cover object-center z-0"
        quality={100}
        priority
      />
      <div className="relative w-[90%] sm:max-w-md lg:max-w-lg mx-auto my-8 p-6 sm:p-8 lg:p-12 backdrop-blur-2xl bg-[#f5f5f5]/5 rounded-[2rem] shadow-lg border border-white/20 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-[2rem] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo-white.png"
              alt="UserHistory Logo"
              width={120}
              height={120}
              className="object-contain"
            />
            <h1 className="text-3xl font-bold text-[#f5f5f5] mt-4 tracking-tight">
              Redefinir Senha
            </h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Nova Senha"
                required
                className="w-full p-3 bg-[#f5f5f5]/5 border border-blue-500/50 rounded-lg text-[#f5f5f5] placeholder-[#f5f5f5]/70 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all duration-300 text-base sm:text-base pr-10"
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-400 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
              {errors.password && (
                <p id="password-error" className="text-red-400 text-xs mt-1">
                  {errors.password}
                </p>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: undefined,
                  }));
                }}
                placeholder="Confirmar Nova Senha"
                required
                className="w-full p-3 bg-[#f5f5f5]/5 border border-blue-500/50 rounded-lg text-[#f5f5f5] placeholder-[#f5f5f5]/70 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all duration-300 text-base sm:text-base pr-10"
                aria-describedby={
                  errors.confirmPassword ? "confirmPassword-error" : undefined
                }
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-400 transition-colors"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmação"
                    : "Mostrar confirmação"
                }
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="text-red-400 text-xs mt-1"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center cursor-pointer bg-gradient-to-r from-blue-500 to-green-500 text-[#f5f5f5] p-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 text-base font-semibold ${
                isLoading
                  ? "opacity-70 cursor-not-allowed"
                  : "animate-pulse-slow"
              }`}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Redefinindo...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-[#f5f5f5]/80 text-sm">
              Voltar para{" "}
              <a
                href="/login"
                className="text-green-500 hover:text-green-400 transition-colors"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
