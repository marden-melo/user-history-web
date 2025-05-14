import { describe, it, expect, afterEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Configs from "../app/configs/page";
import { toast } from "react-toastify";
import * as api from "@/lib/api";
import { useRouter } from "next/navigation";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

// Mock useRouter
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock authRequest
jest.mock("@/lib/api", () => ({
  authRequest: jest.fn(),
}));

// Mock react-toastify
jest.mock("react-toastify", () => ({
  toast: {
    info: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container">ToastContainer</div>,
}));

// Mock child components
jest.mock("@/components/Sidebar", () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));
jest.mock("@/components/UserInfo", () => ({
  default: () => <div data-testid="user-info">UserInfo</div>,
}));
jest.mock("@/components/Modal/deleteRequestModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="delete-modal">Delete Modal</div> : null,
}));

describe("Configs Component", () => {
  const user = {
    id: "6e2a624a-acf0-4d7a-beb8-804b8f771738",
    name: "Marden Melo",
    email: "mardenmelomanager@gmail.com",
    role: "manager",
  };

  const mockPush = jest.mocked(useRouter().push);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with user data", async () => {
    localStorageMock.getItem
      .mockReturnValueOnce(JSON.stringify(user))
      .mockReturnValueOnce("mock-token");

    render(<Configs />);

    expect(screen.getByText("Configurações")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Marden Melo");
    expect(screen.getByLabelText("E-mail")).toHaveValue(
      "mardenmelomanager@gmail.com"
    );
    expect(screen.getByLabelText("Nova Senha (opcional)")).toHaveValue("");
    expect(screen.getByTestId("toast-container")).toBeInTheDocument();
    expect(toast.info).toHaveBeenCalledWith(
      "Dados do usuário carregados com sucesso!"
    );
  });

  it("displays validation errors for invalid inputs", async () => {
    localStorageMock.getItem
      .mockReturnValueOnce(JSON.stringify(user))
      .mockReturnValueOnce("mock-token");

    render(<Configs />);

    await userEvent.clear(screen.getByLabelText("Nome"));
    await userEvent.type(screen.getByLabelText("E-mail"), "invalid-email");
    await userEvent.type(
      screen.getByLabelText("Nova Senha (opcional)"),
      "short"
    );
    await userEvent.type(
      screen.getByLabelText("Confirmar Nova Senha"),
      "different"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Salvar Alterações/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Nome deve ter pelo menos 2 caracteres")
      ).toBeInTheDocument();
      expect(screen.getByText("E-mail inválido")).toBeInTheDocument();
      expect(
        screen.getByText(/Senha deve ter pelo menos 8 caracteres/)
      ).toBeInTheDocument();
      expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(
        "Corrija os erros no formulário"
      );
    });
  });

  it("submits form successfully", async () => {
    localStorageMock.getItem
      .mockReturnValueOnce(JSON.stringify(user))
      .mockReturnValueOnce("mock-token");

    jest.mocked(api.authRequest).mockResolvedValue({});
    localStorageMock.setItem.mockClear();

    render(<Configs />);

    await userEvent.clear(screen.getByLabelText("Nome"));
    await userEvent.type(screen.getByLabelText("Nome"), "Novo Nome");
    await userEvent.clear(screen.getByLabelText("E-mail"));
    await userEvent.type(
      screen.getByLabelText("E-mail"),
      "novo.email@example.com"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Salvar Alterações/i })
    );

    await waitFor(() => {
      expect(api.authRequest).toHaveBeenCalledWith({
        method: "PATCH",
        url: `/users/${user.id}`,
        data: {
          name: "Novo Nome",
          email: "novo.email@example.com",
        },
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({
          ...user,
          name: "Novo Nome",
          email: "novo.email@example.com",
        })
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Perfil atualizado com sucesso!"
      );
    });
  });

  it("handles 403 forbidden error", async () => {
    localStorageMock.getItem
      .mockReturnValueOnce(JSON.stringify(user))
      .mockReturnValueOnce("mock-token");

    jest.mocked(api.authRequest).mockRejectedValue({
      response: { status: 403, data: { message: "Ação não permitida" } },
    });

    render(<Configs />);

    await userEvent.clear(screen.getByLabelText("Nome"));
    await userEvent.type(screen.getByLabelText("Nome"), "Novo Nome");
    await userEvent.click(
      screen.getByRole("button", { name: /Salvar Alterações/i })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Você não tem permissão para realizar esta ação"
      );
    });
  });

  it("handles email already in use error", async () => {
    localStorageMock.getItem
      .mockReturnValueOnce(JSON.stringify(user))
      .mockReturnValueOnce("mock-token");

    jest.mocked(api.authRequest).mockRejectedValue({
      response: { status: 400, data: { message: "Email already in use" } },
    });

    render(<Configs />);

    await userEvent.clear(screen.getByLabelText("E-mail"));
    await userEvent.type(
      screen.getByLabelText("E-mail"),
      "existing.email@example.com"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Salvar Alterações/i })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Este e-mail já está em uso");
    });
  });

  it("redirects to login if session is expired", async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<Configs />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Sessão expirada. Faça login novamente."
      );
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
