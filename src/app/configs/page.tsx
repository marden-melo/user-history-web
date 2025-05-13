"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import UserInfo from "@/components/UserInfo";
import { authRequest } from "@/lib/api";
import { toast, ToastContainer } from "react-toastify"; // Import ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for toast styling
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import DeleteRequestModal from "@/components/Modal/deleteRequestModal";

interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Configs() {
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "lgpd" | "about">(
    "profile"
  );
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isDeleteRequestModalOpen, setIsDeleteRequestModalOpen] =
    useState<boolean>(false);
  const router = useRouter();

  const isLocalStorageAvailable = () => {
    try {
      const test = "__test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      toast.error("Armazenamento local indisponível. Habilite os cookies.");
      router.push("/");
      return;
    }

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      toast.error("Sessão expirada. Faça login novamente.");
      router.push("/");
      return;
    }

    try {
      const parsedUser: UserDTO = JSON.parse(storedUser);
      const validRoles = ["admin", "manager", "user"];
      const normalizedUser = {
        ...parsedUser,
        role: validRoles.includes(parsedUser.role.toLowerCase())
          ? (parsedUser.role.toLowerCase() as "admin" | "manager" | "user")
          : "user",
      };
      setCurrentUser(normalizedUser);
      setFormData({
        name: normalizedUser.name,
        email: normalizedUser.email,
        password: "",
        confirmPassword: "",
      });
      toast.info("Dados do usuário carregados com sucesso!");
    } catch (err) {
      console.error("Erro ao parsear usuário:", err);
      toast.error("Erro ao carregar dados do usuário.");
      router.push("/");
    }
  }, [router]);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name || formData.name.length < 2)
      errors.name = "Nome deve ter pelo menos 2 caracteres";
    if (formData.name.length > 100)
      errors.name = "Nome não pode exceder 100 caracteres";
    if (!formData.email) errors.email = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "E-mail inválido";

    if (formData.password || formData.confirmPassword) {
      const passwordRegex =
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~/-]).{6,50}$/;
      if (!formData.password) {
        errors.password = "Nova senha é obrigatória se confirmada";
      } else if (!passwordRegex.test(formData.password)) {
        errors.password =
          "Senha deve ter pelo menos 8 caracteres, com letras, números e símbolos";
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = "Confirmação de senha é obrigatória";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "As senhas não coincidem";
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Corrija os erros no formulário");
    }
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    []
  );

  const updateProfile = async () => {
    if (!currentUser || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data: Partial<FormData> = {
        name: formData.name,
        email: formData.email,
      };
      const isPasswordChanged = !!formData.password;
      if (isPasswordChanged) {
        data.password = formData.password;
      }

      await authRequest({
        method: "PATCH",
        url: `/users/${currentUser.id}`,
        data,
      });
      setCurrentUser({
        ...currentUser,
        name: formData.name,
        email: formData.email,
      });
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          name: formData.name,
          email: formData.email,
        })
      );
      toast.success(
        isPasswordChanged
          ? "Perfil e senha atualizados com sucesso!"
          : "Perfil atualizado com sucesso!"
      );
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      setFormErrors({});
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/");
        return;
      }
      const message =
        err.response?.data?.message === "Email already in use"
          ? "Este e-mail já está em uso"
          : err.response?.status === 403
          ? "Você não tem permissão para realizar esta ação"
          : err.response?.data?.message || "Erro ao atualizar perfil";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteRequestModal = () => {
    setIsDeleteRequestModalOpen(true);
    toast.info("Solicitação de exclusão de dados iniciada.");
  };

  const closeDeleteRequestModal = () => {
    setIsDeleteRequestModalOpen(false);
    toast.info("Solicitação de exclusão de dados cancelada.");
  };

  const handleTabChange = (tab: "profile" | "lgpd" | "about") => {
    setActiveTab(tab);
  };

  const tabs = [
    { id: "profile", label: "Perfil" },
    { id: "lgpd", label: "Conformidade LGPD" },
    { id: "about", label: "Sobre a Aplicação" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-900 bg-opacity-90 text-gray-100 font-sans">
      {/* Add ToastContainer here */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 flex flex-col items-center w-full md:ml-64">
        <div className="w-full max-w-7xl flex justify-end mb-8 md:mb-10">
          <UserInfo />
        </div>
        <div className="w-full max-w-5xl">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-100 tracking-wider uppercase mb-8 md:mb-12 text-center animate-fade-in">
            Configurações
          </h2>
          <div className="bg-gray-700 bg-opacity-30 backdrop-blur-lg rounded-2xl border border-gray-600 border-opacity-50 shadow-2xl p-6 md:p-8">
            <div
              className="flex border-b border-gray-600 border-opacity-50 mb-6"
              role="tablist"
              aria-label="Configurações"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as typeof activeTab)}
                  className={`px-4 py-2 text-sm md:text-base font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "text-gray-100 border-b-2 border-gray-200"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === "profile" && (
              <div
                className="space-y-6 animate-fade-in"
                id="panel-profile"
                role="tabpanel"
              >
                <h3 className="text-xl md:text-2xl font-semibold text-gray-100">
                  Editar Perfil
                </h3>
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateProfile();
                  }}
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm md:text-base font-medium text-gray-300 mb-1"
                    >
                      Nome
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-600 border-opacity-50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                      required
                      aria-describedby={
                        formErrors.name ? "name-error" : undefined
                      }
                    />
                    {formErrors.name && (
                      <p id="name-error" className="text-red-400 text-xs mt-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm md:text-base font-medium text-gray-300 mb-1"
                    >
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-600 border-opacity-50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                      required
                      aria-describedby={
                        formErrors.email ? "email-error" : undefined
                      }
                    />
                    {formErrors.email && (
                      <p id="email-error" className="text-red-400 text-xs mt-1">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm md:text-base font-medium text-gray-300 mb-1"
                    >
                      Nova Senha (opcional)
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-600 border-opacity-50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all pr-10"
                        aria-describedby={
                          formErrors.password ? "password-error" : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                        aria-label={
                          showPassword
                            ? "Ocultar nova senha"
                            : "Mostrar nova senha"
                        }
                      >
                        {showPassword ? (
                          <AiOutlineEyeInvisible size={20} />
                        ) : (
                          <AiOutlineEye size={20} />
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p
                        id="password-error"
                        className="text-red-400 text-xs mt-1"
                      >
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm md:text-base font-medium text-gray-300 mb-1"
                    >
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-600 border-opacity-50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all pr-10"
                        aria-describedby={
                          formErrors.confirmPassword
                            ? "confirmPassword-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowConfirmPassword(!showConfirmPassword);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                        aria-label={
                          showConfirmPassword
                            ? "Ocultar confirmação"
                            : "Mostrar confirmação"
                        }
                      >
                        {showConfirmPassword ? (
                          <AiOutlineEyeInvisible size={20} />
                        ) : (
                          <AiOutlineEye size={20} />
                        )}
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <p
                        id="confirmPassword-error"
                        className="text-red-400 text-xs mt-1"
                      >
                        {formErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`py-3 px-6 rounded-lg transition-all shadow-md flex items-center justify-center cursor-pointer text-base ${
                        isSubmitting
                          ? "bg-gray-600 bg-opacity-50 cursor-not-allowed"
                          : "bg-gray-600 bg-opacity-70 hover:bg-gray-500 text-gray-100"
                      }`}
                      aria-busy={isSubmitting}
                      aria-label="Salvar alterações do perfil"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 mr-2 text-gray-100"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
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
                              d="M4 12a8 8 0 018-8v8h-8z"
                            />
                          </svg>
                          Salvando...
                        </>
                      ) : (
                        "Salvar Alterações"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            {activeTab === "lgpd" && (
              <div
                className="space-y-6 animate-fade-in"
                id="panel-lgpd"
                role="tabpanel"
              >
                <h3 className="text-xl md:text-2xl font-semibold text-gray-100">
                  Conformidade com a LGPD
                </h3>
                <p className="text-base md:text-lg text-gray-300">
                  Estamos em conformidade com a Lei Geral de Proteção de Dados
                  (LGPD - Lei nº 13.709/2018). Nosso compromisso inclui:
                </p>
                <ul className="list-disc list-inside text-base md:text-lg text-gray-400 space-y-2">
                  <li>Transparência no tratamento de dados pessoais.</li>
                  <li>
                    Segurança no armazenamento e processamento de informações.
                  </li>
                  <li>Consentimento explícito para coleta e uso de dados.</li>
                  <li>Direito de acessar, corrigir ou excluir seus dados.</li>
                </ul>
                <p className="text-base md:text-lg text-gray-300">
                  Para solicitações relacionadas à privacidade, entre em contato
                  com{" "}
                  <a
                    href="mailto:suporte@going2.com"
                    className="text-blue-400 hover:underline cursor-pointer"
                  >
                    mardenmelo@gmail.com
                  </a>
                  . Você também pode solicitar a exclusão de seus dados
                  diretamente.
                </p>
                <button
                  onClick={openDeleteRequestModal}
                  className="py-3 px-6 rounded-lg bg-red-600 bg-opacity-70 hover:bg-red-500 text-gray-100 transition-all shadow-md cursor-pointer"
                  aria-label="Solicitar exclusão de dados"
                >
                  Solicitar Exclusão de Dados
                </button>
              </div>
            )}
            {activeTab === "about" && (
              <div
                className="space-y-6 animate-fade-in"
                id="panel-about"
                role="tabpanel"
              >
                <h3 className="text-xl md:text-2xl font-semibold text-gray-100">
                  Sobre a Aplicação
                </h3>
                <p className="text-base md:text-lg text-gray-300">
                  Desenvolvido por{" "}
                  <span className="font-semibold text-gray-100">
                    Marden Melo
                  </span>{" "}
                  para a{" "}
                  <span className="font-semibold text-gray-100">Going 2</span>.
                  Versão 1.0.0.
                </p>
                <p className="text-base md:text-lg text-gray-400">
                  Funcionalidades principais:
                </p>
                <ul className="list-disc list-inside text-base md:text-lg text-gray-400 space-y-2">
                  <li>
                    Gerenciamento de usuários com níveis de acesso (ADMIN,
                    MANAGER, USER).
                  </li>
                  <li>Autenticação segura com JWT e renovação de tokens.</li>
                  <li>Atualização de perfis com validação robusta.</li>
                  <li>
                    Interface responsiva com tema escuro e efeitos visuais.
                  </li>
                </ul>
                <p className="text-base md:text-lg text-gray-400">
                  Para suporte ou feedback, envie um e-mail para{" "}
                  <a
                    href="mailto:mardenmelo@gmail.com"
                    className="text-blue-400 hover:underline cursor-pointer"
                  >
                    mardenmelo@gmail.com
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
        <DeleteRequestModal
          isOpen={isDeleteRequestModalOpen}
          onClose={closeDeleteRequestModal}
        />
      </main>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
