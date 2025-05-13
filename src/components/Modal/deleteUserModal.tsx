"use client";

import { useEffect, useRef } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  createdAt: string;
  updatedAt: string;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  user: User | null;
  isSubmitting: boolean;
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  onDelete,
  user,
  isSubmitting,
}: DeleteUserModalProps) {
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

  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="relative bg-gray-700 bg-opacity-30 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-gray-600 border-opacity-50 shadow-2xl"
      >
        <h2 className="text-2xl font-semibold text-gray-100 mb-6 text-center">
          Confirmar Exclusão
        </h2>
        <p className="text-gray-300 text-center mb-6">
          Tem certeza que deseja excluir o usuário{" "}
          <span className="font-medium text-gray-100">{user.name}</span>?
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className={`flex-1 py-3 rounded-lg transition-all shadow-md cursor-pointer text-base ${
              isSubmitting
                ? "bg-red-400 bg-opacity-70 cursor-not-allowed"
                : "bg-red-600 bg-opacity-70 hover:bg-red-500 text-gray-100"
            }`}
            aria-label={`Confirmar exclusão de ${user.name}`}
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
                Deletando...
              </>
            ) : (
              "Confirmar"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-gray-600 bg-opacity-70 hover:bg-gray-700 transition-all shadow-md cursor-pointer text-base text-gray-100"
            aria-label="Cancelar exclusão"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
