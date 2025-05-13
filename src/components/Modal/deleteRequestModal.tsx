"use client";

import { useEffect, useRef } from "react";

interface DeleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteRequestModal({
  isOpen,
  onClose,
}: DeleteRequestModalProps) {
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
        className="relative bg-gray-700 bg-opacity-30 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-gray-600 border-opacity-50 shadow-2xl"
      >
        <h2 className="text-2xl font-semibold text-gray-100 mb-6 text-center">
          Solicitação de Exclusão
        </h2>
        <p className="text-gray-300 text-center mb-6">
          Solicitação de exclusão enviada com sucesso!
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-6 rounded-lg bg-gray-600 bg-opacity-70 hover:bg-gray-700 transition-all shadow-md cursor-pointer text-base text-gray-100"
            aria-label="Fechar modal"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
