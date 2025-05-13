"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import UserInfo from "@/components/UserInfo";
import { authRequest } from "@/lib/api";
import { toast } from "react-toastify";
import EditUserModal from "@/components/Modal/editUserModal";
import DeleteUserModal from "@/components/Modal/deleteUserModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  email: string;
  currentPassword: string;
  password: string;
  confirmPassword: string;
  role: "admin" | "manager" | "user";
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});
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
      const parsedUser: User = JSON.parse(storedUser);
      const validRoles = ["admin", "manager", "user"];
      const normalizedUser = {
        ...parsedUser,
        role: validRoles.includes(parsedUser.role.toLowerCase())
          ? (parsedUser.role.toLowerCase() as "admin" | "manager" | "user")
          : "user",
      };
      setCurrentUser(normalizedUser);
      if (normalizedUser.role === "user") {
        toast.info("Acesse suas configurações para editar seu perfil.");
        router.push("/configs");
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error("Erro ao parsear usuário:", err);
      toast.error("Erro ao carregar dados do usuário.");
      router.push("/");
    }
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await authRequest({ method: "GET", url: "/users" });
      const fetchedUsers = Array.isArray(response.data)
        ? response.data.map((user) => ({
            ...user,
            role: user.role.toLowerCase() as "admin" | "manager" | "user",
          }))
        : [];
      setUsers(fetchedUsers);
      toast.success("Usuários carregados com sucesso!");
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/");
        return;
      }
      toast.error(err.response?.data?.message || "Erro ao carregar usuários");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name || formData.name.length < 2)
      errors.name = "Nome deve ter pelo menos 2 caracteres";
    if (formData.name.length > 100)
      errors.name = "Nome não pode exceder 100 caracteres";
    if (!formData.email) errors.email = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "E-mail inválido";

    if (!selectedUser) {
      // Novo usuário
      if (!formData.password)
        errors.password = "Senha é obrigatória para novos usuários";
      const passwordRegex =
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~/-]).{6,50}$/;
      if (formData.password && !passwordRegex.test(formData.password)) {
        errors.password =
          "Senha deve ter 6-50 caracteres, com letras, números e símbolos";
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = "Confirmação de senha é obrigatória";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "As senhas não coincidem";
      }
      if (!formData.role) errors.role = "Função é obrigatória";
    } else if (formData.password) {
      // Edição de usuário com alteração de senha
      const passwordRegex =
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~/-]).{6,50}$/;
      if (!passwordRegex.test(formData.password)) {
        errors.password =
          "Senha deve ter 6-50 caracteres, com letras, números e símbolos";
      }
      if (currentUser?.role !== "admin") {
        if (!formData.currentPassword)
          errors.currentPassword =
            "Senha atual é obrigatória para alterar a senha";
        if (!formData.confirmPassword) {
          errors.confirmPassword = "Confirmação de senha é obrigatória";
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = "As senhas não coincidem";
        }
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Por favor, corrija os erros no formulário");
    }
    return Object.keys(errors).length === 0;
  };

  const createUser = async () => {
    if (currentUser?.role !== "admin") {
      toast.error("Apenas administradores podem criar usuários");
      return;
    }
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authRequest({
        method: "POST",
        url: "/users",
        data: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        },
      });
      setUsers([
        ...users,
        { ...response.data, role: response.data.role.toLowerCase() },
      ]);
      toast.success("Usuário criado com sucesso!");
      closeModal();
      fetchUsers();
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
          : err.response?.data?.message || "Erro ao criar usuário";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUser = async () => {
    if (!selectedUser) return;
    if (currentUser?.role === "manager" && selectedUser.role === "admin") {
      toast.error("Gerentes não podem editar administradores");
      return;
    }
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data: Partial<FormData> = {
        name: formData.name,
        email: formData.email,
      };
      if (formData.password) {
        if (currentUser?.role !== "admin") {
          data.currentPassword = formData.currentPassword;
        }
        data.password = formData.password;
      }
      if (currentUser?.role === "admin") {
        data.role = formData.role;
      }
      await authRequest({
        method: "PATCH",
        url: `/users/${selectedUser.id}`,
        data,
      });
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? { ...u, ...data, role: data.role || u.role }
            : u
        )
      );
      toast.success("Usuário atualizado com sucesso!");
      closeModal();
      fetchUsers();
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
          : err.response?.data?.message === "Current password is incorrect"
          ? "Senha atual incorreta"
          : err.response?.status === 403
          ? "Você não tem permissão para realizar esta ação"
          : err.response?.data?.message || "Erro ao atualizar usuário";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete || currentUser?.role !== "admin") {
      toast.error("Apenas administradores podem excluir usuários");
      return;
    }

    setIsSubmitting(true);
    try {
      await authRequest({ method: "DELETE", url: `/users/${userToDelete.id}` });
      setUsers(users.filter((u) => u.id !== userToDelete.id));
      toast.success("Usuário excluído com sucesso!");
      closeDeleteModal();
      fetchUsers();
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Sessão expirada. Faça login novamente.");
        router.push("/");
        return;
      }
      const message =
        err.response?.data?.message === "Cannot delete own account"
          ? "Você não pode excluir sua própria conta"
          : err.response?.status === 403
          ? "Você não tem permissão para realizar esta ação"
          : err.response?.data?.message || "Erro ao excluir usuário";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      await updateUser();
    } else {
      await createUser();
    }
  };

  const openModal = (user: User | null = null) => {
    if (user && currentUser?.role === "manager" && user.role === "admin") {
      toast.error("Gerentes não podem editar administradores");
      return;
    }
    setSelectedUser(user);
    setFormData(
      user
        ? {
            name: user.name,
            email: user.email,
            currentPassword: "",
            password: "",
            confirmPassword: "",
            role: user.role,
          }
        : {
            name: "",
            email: "",
            currentPassword: "",
            password: "",
            confirmPassword: "",
            role: "user",
          }
    );
    setFormErrors({});
    setShowCurrentPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormErrors({});
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-gray-900 bg-opacity-90 text-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 flex flex-col items-center w-full md:ml-64">
        <div className="w-full max-w-7xl flex justify-end mb-8 md:mb-10">
          <UserInfo />
        </div>
        <div className="w-full max-w-7xl">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-100 tracking-wider uppercase mb-8 md:mb-12 text-center animate-fade-in">
            Gerenciamento de Usuários
          </h1>

          {currentUser.role === "admin" && (
            <div className="flex justify-end mb-8">
              <button
                onClick={() => openModal()}
                className="px-6 py-3 bg-green-600 bg-opacity-70 rounded-lg shadow-md hover:bg-green-500 transition-all duration-300 cursor-pointer text-base text-gray-100"
                aria-label="Adicionar novo usuário"
              >
                + Novo Usuário
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-center text-gray-400 text-lg">
              Carregando usuários...
            </p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 text-lg">
              Nenhum usuário cadastrado
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="relative bg-gray-700 bg-opacity-30 backdrop-blur-lg rounded-2xl border border-gray-600 border-opacity-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-100 mb-3 line-clamp-2">
                      {user.name}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-400">
                        <span className="font-medium">E-mail:</span>{" "}
                        {user.email}
                      </p>
                      <p className="text-gray-400">
                        <span className="font-medium">Função:</span>{" "}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </p>
                      <p className="text-gray-400">
                        <span className="font-medium">Criado em:</span>{" "}
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  {(currentUser.role === "admin" ||
                    (currentUser.role === "manager" &&
                      user.role !== "admin")) && (
                    <div className="p-6 pt-0 flex gap-3">
                      <button
                        onClick={() => openModal(user)}
                        className="flex-1 bg-gray-600 bg-opacity-70 py-2 rounded-lg hover:bg-gray-500 transition-colors cursor-pointer text-sm font-medium text-gray-100"
                        aria-label={`Editar usuário ${user.name}`}
                      >
                        Editar
                      </button>
                      {currentUser.role === "admin" && (
                        <button
                          onClick={() => {
                            if (user.id === currentUser.id) {
                              toast.error(
                                "Você não pode excluir sua própria conta"
                              );
                              return;
                            }
                            setUserToDelete(user);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={
                            isSubmitting && userToDelete?.id === user.id
                          }
                          className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium ${
                            isSubmitting && userToDelete?.id === user.id
                              ? "bg-red-400 bg-opacity-70 cursor-not-allowed"
                              : "bg-red-600 bg-opacity-70 hover:bg-red-500 text-gray-100"
                          }`}
                          aria-label={`Excluir usuário ${user.name}`}
                        >
                          {isSubmitting && userToDelete?.id === user.id
                            ? "Deletando..."
                            : "Excluir"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <EditUserModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={saveUser}
          formData={formData}
          formErrors={formErrors}
          handleInputChange={handleInputChange}
          selectedUser={selectedUser}
          currentUser={currentUser}
          isSubmitting={isSubmitting}
          showCurrentPassword={showCurrentPassword}
          setShowCurrentPassword={setShowCurrentPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />

        <DeleteUserModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onDelete={deleteUser}
          user={userToDelete}
          isSubmitting={isSubmitting}
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
