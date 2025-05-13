"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authRequest } from "@/lib/api";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";

interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
}

interface UserListProps {
  currentUser: UserDTO;
}

export default function UserList({ currentUser }: UserListProps) {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (currentUser.role !== "admin" && currentUser.role !== "manager") {
      toast.error("Você não tem permissão para visualizar todos os usuários.");
      router.push("/configs");
      return;
    }
    fetchUsers();
  }, [currentUser, router]);

  const fetchUsers = async () => {
    try {
      const response = await authRequest({
        method: "GET",
        url: "/users",
      });
      setUsers(response.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error(
          "Você não tem permissão para visualizar todos os usuários."
        );
        router.push("/configs");
      } else {
        toast.error("Erro ao carregar lista de usuários.");
      }
    }
  };

  const handleEdit = (userId: string) => {
    router.push(`/users/edit/${userId}`);
  };

  const handleDelete = async (userId: string) => {
    if (currentUser.role !== "admin") {
      toast.error("Você não tem permissão para excluir usuários.");
      return;
    }
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        await authRequest({
          method: "DELETE",
          url: `/users/${userId}`,
        });
        setUsers(users.filter((user) => user.id !== userId));
        toast.success("Usuário excluído com sucesso!");
      } catch (err: any) {
        const message =
          err.response?.data?.message || "Erro ao excluir usuário";
        toast.error(message);
      }
    }
  };

  return (
    <div className="space-y-4">
      {users.length === 0 ? (
        <p className="text-gray-400">Nenhum usuário encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-100">
            <thead className="bg-gray-800 bg-opacity-50">
              <tr>
                <th className="p-3 text-sm md:text-base font-medium">Nome</th>
                <th className="p-3 text-sm md:text-base font-medium">E-mail</th>
                <th className="p-3 text-sm md:text-base font-medium">Função</th>
                <th className="p-3 text-sm md:text-base font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-600 border-opacity-50"
                >
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 capitalize">{user.role}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(user.id)}
                      className="p-2 text-blue-400 hover:text-blue-300 cursor-pointer"
                      aria-label={`Editar usuário ${user.name}`}
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={currentUser.role !== "admin"}
                      className={`p-2 ${
                        currentUser.role !== "admin"
                          ? "text-gray-600 cursor-not-allowed"
                          : "text-red-400 hover:text-red-300 cursor-pointer"
                      }`}
                      aria-label={`Excluir usuário ${user.name}`}
                    >
                      <FaTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
