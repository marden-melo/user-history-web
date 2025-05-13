"use client";

import { useEffect, useRef } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

interface FormData {
  name: string;
  email: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
  role: "admin" | "manager" | "user";
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  createdAt: string;
  updatedAt: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: FormData;
  formErrors: Partial<Record<keyof FormData, string>>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  selectedUser: User | null;
  currentUser: User | null;
  isSubmitting: boolean;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (value: boolean) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
}

const labels: Record<keyof FormData, string> = {
  name: "Nome",
  email: "E-mail",
  currentPassword: "Senha Atual",
  password: "Nova Senha",
  confirmPassword: "Confirmar Nova Senha",
  role: "Função",
};

export default function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  formErrors,
  handleInputChange,
  selectedUser,
  currentUser,
  isSubmitting,
  showCurrentPassword,
  setShowCurrentPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: EditUserModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="relative bg-gray-700 bg-opacity-30 backdrop-blur-lg rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-600 border-opacity-50 shadow-2xl"
      >
        <h2 className="text-2xl font-semibold text-gray-100 mb-6 text-center">
          {selectedUser ? "Editar Usuário" : "Novo Usuário"}
        </h2>
        <form className="space-y-5" onSubmit={onSubmit}>
          {Object.entries(formData).map(([key, value]) => {
            if (
              key === "currentPassword" &&
              (!selectedUser || currentUser?.role === "admin")
            ) {
              return null;
            }
            if (
              key === "confirmPassword" &&
              selectedUser &&
              currentUser?.role === "admin"
            ) {
              return null;
            }
            return (
              <div key={key} className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {labels[key as keyof FormData]}
                  {key === "password" && selectedUser && " (opcional)"}
                </label>
                {key === "role" ? (
                  currentUser?.role === "admin" ? (
                    <select
                      name={key}
                      value={value}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-600 border-opacity-50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all text-base"
                      required={!selectedUser}
                      aria-describedby={
                        formErrors[key] ? `${key}-error` : undefined
                      }
                    >
                      <option value="">Selecione...</option>
                      <option value="admin">Administrador</option>
                      <option value="manager">Gerente</option>
                      <option value="user">Usuário</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={value}
                      readOnly
                      className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-600 border-opacity-50 rounded-lg text-gray-100 text-base"
                    />
                  )
                ) : key === "name" ? (
                  <div>
                    <input
                      type="text"
                      name={key}
                      value={value}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-600 border-opacity-50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all text-base"
                      required
                      aria-describedby={
                        formErrors[key] ? `${key}-error` : undefined
                      }
                    />
                    {formErrors[key] && (
                      <p
                        className="text-red-400 text-xs mt-1"
                        id={`${key}-error`}
                      >
                        {formErrors[key]}
                      </p>
                    )}
                  </div>
                ) : key === "email" ? (
                  <div>
                    <input
                      type="email"
                      name={key}
                      value={value}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-600 border-opacity-50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all text-base"
                      required
                      aria-describedby={
                        formErrors[key] ? `${key}-error` : undefined
                      }
                    />
                    {formErrors[key] && (
                      <p
                        className="text-red-400 text-xs mt-1"
                        id={`${key}-error`}
                      >
                        {formErrors[key]}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type={
                        key === "currentPassword"
                          ? showCurrentPassword
                            ? "text"
                            : "password"
                          : key === "password"
                          ? showPassword
                            ? "text"
                            : "password"
                          : showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name={key}
                      value={value}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-800 bg-opacity-50 border border-gray-600 border-opacity-50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all text-base pr-10"
                      required={key === "password" && !selectedUser}
                      aria-describedby={
                        formErrors[key] ? `${key}-error` : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        key === "currentPassword"
                          ? setShowCurrentPassword(!showCurrentPassword)
                          : key === "password"
                          ? setShowPassword(!showPassword)
                          : setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                      aria-label={
                        (key === "currentPassword" && showCurrentPassword) ||
                        (key === "password" && showPassword) ||
                        (key === "confirmPassword" && showConfirmPassword)
                          ? `Ocultar ${labels[key]}`
                          : `Mostrar ${labels[key]}`
                      }
                    >
                      {(key === "currentPassword" && showCurrentPassword) ||
                      (key === "password" && showPassword) ||
                      (key === "confirmPassword" && showConfirmPassword) ? (
                        <AiOutlineEyeInvisible size={20} />
                      ) : (
                        <AiOutlineEye size={20} />
                      )}
                    </button>
                    {formErrors[key] && (
                      <p
                        className="text-red-400 text-xs mt-1"
                        id={`${key}-error`}
                      >
                        {formErrors[key]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-lg transition-all shadow-md flex items-center justify-center cursor-pointer text-base ${
                isSubmitting
                  ? "bg-gray-600 bg-opacity-50 cursor-not-allowed"
                  : "bg-gray-600 bg-opacity-70 hover:bg-gray-500 text-gray-100"
              }`}
              aria-busy={isSubmitting}
              aria-label={selectedUser ? "Atualizar usuário" : "Criar usuário"}
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
                  {selectedUser ? "Atualizando..." : "Cadastrando..."}
                </>
              ) : (
                "Salvar"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-gray-600 bg-opacity-70 hover:bg-gray-700 transition-all shadow-md cursor-pointer text-base text-gray-100"
              aria-label="Cancelar"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
