"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { FiHome, FiMenu, FiSettings, FiX } from "react-icons/fi";
import { PiUsersFour } from "react-icons/pi";
import { toast } from "react-toastify";

interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  createdAt: string;
  updatedAt: string;
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "manager" | "user" | null>(
    null
  );
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!userJson || !token) {
      toast.error("Sessão expirada. Faça login novamente.");
      router.push("/");
      return;
    }
    try {
      const user: UserDTO = JSON.parse(userJson);
      setUserRole(user.role.toLowerCase() as "admin" | "manager" | "user");
    } catch (err) {
      console.error("Erro ao parsear user do localStorage:", err);
      toast.error("Erro ao carregar dados do usuário.");
      router.push("/");
    }
  }, [router]);

  const menuItems = [
    {
      name: "Visão Geral",
      path: "/dashboard",
      icon: <FiHome className="w-5 h-5" />,
    },
    {
      name: "Gestão de Usuários",
      path: "/users",
      icon: <PiUsersFour className="w-5 h-5" />,
      restrictedTo: ["admin", "manager"],
    },
    {
      name: "Configurações",
      path: "/configs",
      icon: <FiSettings className="w-5 h-5" />,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.restrictedTo ? item.restrictedTo.includes(userRole || "") : true
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout realizado com sucesso!");
    router.push("/");
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (userRole === null) {
    return null;
  }

  return (
    <>
      <button
        onClick={toggleMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white focus:outline-none cursor-pointer"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-950 text-white flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 z-40`}
      >
        <div className="relative p-4 mb-8 mt-16 md:mt-4">
          <div className="absolute inset-0 rounded-xl pointer-events-none" />
          <div className="flex justify-center relative z-10">
            <Image
              src="/logo-white.png"
              alt="USERHISTORY Logo"
              width={150}
              height={100}
              className="object-contain"
            />
          </div>
        </div>

        <ul className="space-y-3 flex-1 overflow-y-auto px-4">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center p-3 rounded-lg transition-all duration-300 group ${
                    isActive
                      ? "bg-white/10 text-white border-l-4 border-purple-400"
                      : "text-gray-200 hover:bg-white/5 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className={`mr-3 transition-colors duration-300 ${
                      isActive
                        ? "text-purple-400"
                        : "text-gray-400 group-hover:text-purple-400"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          onClick={handleLogout}
          className="mt-4 mb-6 mx-4 bg-gradient-to-r cursor-pointer from-red-500 to-red-700 text-white px-5 py-2 rounded-lg hover:from-red-600 hover:to-red-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 text-sm font-medium"
          aria-label="Sair"
        >
          Sair
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={toggleMenu}
        />
      )}
    </>
  );
}
