"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import UserInfo from "@/components/UserInfo";
import Link from "next/link";
import { authRequest } from "@/lib/api";

interface Stats {
  totalUsers: number;
  admins: number;
  managers: number;
  users: number;
}

interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "USER";
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    admins: 0,
    managers: 0,
    users: 0,
  });
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/");
      return;
    }

    try {
      const parsedUser: UserDTO = JSON.parse(storedUser);
      setCurrentUser({
        ...parsedUser,
        role: parsedUser.role.toUpperCase() as "ADMIN" | "MANAGER" | "USER",
      });
    } catch (err) {
      console.error("Erro ao parsear usuário:", err);
      router.push("/");
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await authRequest({
          method: "GET",
          url: "/users",
        });
        const users: UserDTO[] = Array.isArray(response.data)
          ? response.data.map((u) => ({
              ...u,
              role: u.role.toUpperCase() as "ADMIN" | "MANAGER" | "USER",
            }))
          : [];
        const stats: Stats = {
          totalUsers: users.length,
          admins: users.filter((u) => u.role === "ADMIN").length,
          managers: users.filter((u) => u.role === "MANAGER").length,
          users: users.filter((u) => u.role === "USER").length,
        };
        setStats(stats);
      } catch (err: any) {
        console.log(err);
        const errorMessage = "Erro ao carregar estatísticas";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (!currentUser) return null;

  const canViewAllStats = currentUser.role === "ADMIN";
  const canViewTotalUsers =
    currentUser.role === "ADMIN" || currentUser.role === "MANAGER";
  const canManageUsers =
    currentUser.role === "ADMIN" || currentUser.role === "MANAGER";
  const canViewConfigs = true;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 flex flex-col items-center w-full md:ml-64">
        <div className="w-full max-w-7xl flex justify-end mb-8 md:mb-12">
          <UserInfo />
        </div>
        <div className="w-full max-w-5xl space-y-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-center text-gray-100 uppercase animate-fade-in">
            Dashboard
          </h2>
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-400 border-t-gray-100 rounded-full animate-spin" />
              <p className="text-lg text-gray-400 animate-pulse">
                Carregando dados...
              </p>
            </div>
          ) : error && currentUser.role !== "USER" ? (
            <p className="text-center text-red-400 text-lg md:text-xl bg-gray-700/30 backdrop-blur-md p-4 rounded-lg">
              {error}
            </p>
          ) : (
            <div className="space-y-10">
              {(canViewTotalUsers || canViewAllStats) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {canViewTotalUsers && (
                    <div className="relative bg-gray-700/30 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in">
                      <div className="absolute top-4 right-4 w-12 h-12 bg-gray-600/20 rounded-full flex items-center justify-center">
                        <span className="text-gray-300 text-3xl">👥</span>
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-100 mt-8 mb-2">
                        Total de Usuários
                      </h3>
                      <p className="text-4xl md:text-5xl font-extrabold text-gray-100">
                        {stats.totalUsers}
                      </p>
                    </div>
                  )}
                  {canViewAllStats && (
                    <>
                      <div className="relative bg-gray-700/30 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in">
                        <div className="absolute top-4 right-4 w-12 h-12 bg-gray-600/20 rounded-full flex items-center justify-center">
                          <span className="text-gray-300 text-3xl">👑</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-100 mt-8 mb-2">
                          Administradores
                        </h3>
                        <p className="text-4xl md:text-5xl font-extrabold text-gray-100">
                          {stats.admins}
                        </p>
                      </div>
                      <div className="relative bg-gray-700/30 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in">
                        <div className="absolute top-4 right-4 w-12 h-12 bg-gray-600/20 rounded-full flex items-center justify-center">
                          <span className="text-gray-300 text-3xl">👷</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-100 mt-8 mb-2">
                          Gerentes
                        </h3>
                        <p className="text-4xl md:text-5xl font-extrabold text-gray-100">
                          {stats.managers}
                        </p>
                      </div>
                      <div className="relative bg-gray-700/30 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in">
                        <div className="absolute top-4 right-4 w-12 h-12 bg-gray-600/20 rounded-full flex items-center justify-center">
                          <span className="text-gray-300 text-3xl">👤</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-gray-100 mt-8 mb-2">
                          Usuários Comuns
                        </h3>
                        <p className="text-4xl md:text-5xl font-extrabold text-gray-100">
                          {stats.users}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {canManageUsers && (
                  <Link href="/users">
                    <div className="bg-gray-700/30 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in flex flex-col items-center text-center">
                      <span className="text-gray-300 text-4xl md:text-5xl mb-4">
                        👥
                      </span>
                      <h3 className="text-xl md:text-2xl font-semibold text-gray-100">
                        Gerenciar Usuários
                      </h3>
                    </div>
                  </Link>
                )}
                {canViewConfigs && (
                  <Link href="/configs">
                    <div className="bg-gray-700/30 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in flex flex-col items-center text-center">
                      <span className="text-gray-300 text-4xl md:text-5xl mb-4">
                        ⚙️
                      </span>
                      <h3 className="text-xl md:text-2xl font-semibold text-gray-100">
                        Configurações
                      </h3>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
