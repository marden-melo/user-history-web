"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api, { authRequest } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authRequest({
        method: "POST",
        url: "/auth/login",
        data: { email, password },
      });
      const { access_token, refresh_token, user } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      document.cookie = `refresh_token=${refresh_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`;

      toast.success("Login bem-sucedido! Entrando no painel...", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });

      await router.push("/dashboard");
    } catch (err: any) {
      const errorMessage = "Credenciais inválidas";
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
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalLoading(true);

    try {
      await api({
        method: "POST",
        url: "/auth/forgot-password",
        data: { email: forgotEmail },
      });

      toast.success("E-mail de redefinição enviado com sucesso!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });

      setIsModalOpen(false);
      setForgotEmail("");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Erro ao enviar e-mail de redefinição";
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
    } finally {
      setIsModalLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForgotEmail("");
    setIsModalLoading(false);
  };

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
              Acesse sua conta
            </h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                required
                className="w-full p-3 bg-[#f5f5f5]/5 border border-blue-500/50 rounded-lg text-[#f5f5f5] placeholder-[#f5f5f5]/70 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all duration-300 text-base sm:text-base"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                required
                className="w-full p-3 bg-[#f5f5f5]/5 border border-blue-500/50 rounded-lg text-[#f5f5f5] placeholder-[#f5f5f5]/70 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all duration-300 text-base sm:text-base pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-400 transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center cursor-pointer bg-gradient-to-r from-blue-500 to-green-500 text-[#f5f5f5] p-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 text-base font-semibold ${
                isLoading
                  ? "opacity-70 cursor-not-allowed"
                  : "animate-pulse-slow"
              }`}
            >
              {isLoading ? (
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
              ) : null}
              {isLoading ? "Carregando..." : "Entrar"}
            </button>
          </form>
          <div className="relative z-10 mt-6 text-center space-y-2">
            <p className="text-[#f5f5f5]/80 text-sm">
              Esqueceu sua senha?{" "}
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-green-500 hover:text-green-400 transition-colors"
              >
                Redefinir senha
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Redefinição de Senha */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 transition-opacity duration-300"
          onClick={closeModal}
        >
          <div
            className="relative w-[90%] sm:max-w-md mx-auto p-6 sm:p-8 backdrop-blur-2xl bg-[#f5f5f5]/5 rounded-[2rem] shadow-lg border border-white/20 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-[2rem] pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-[#f5f5f5] mb-6 text-center">
                Redefinir Senha
              </h2>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="relative">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    required
                    className="w-full p-3 bg-[#f5f5f5]/5 border border-blue-500/50 rounded-lg text-[#f5f5f5] placeholder-[#f5f5f5]/70 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/50 transition-all duration-300 text-base"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-[#f5f5f5]/5 text-[#f5f5f5] p-3 rounded-lg hover:bg-[#f5f5f5]/10 transition-all duration-300 text-base font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isModalLoading}
                    className={`flex-1 bg-gradient-to-r from-blue-500 to-green-500 text-[#f5f5f5] p-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/50 text-base font-semibold ${
                      isModalLoading
                        ? "opacity-70 cursor-not-allowed"
                        : "animate-pulse-slow"
                    }`}
                  >
                    {isModalLoading ? (
                      <svg
                        className="animate-spin w-5 h-5 mx-auto"
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
                    ) : (
                      "Enviar"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
