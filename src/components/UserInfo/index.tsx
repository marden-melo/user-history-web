"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const UserInfo = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/");
    }
  }, [router]);

  if (!user) {
    return <p className="text-gray-400">Carregando usuário...</p>;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
        <span className="text-white font-semibold text-lg">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div>
        <p className="text-white font-medium">{user.name}</p>
        <p className="text-gray-400 text-sm">{user.email}</p>
      </div>
    </div>
  );
};

export default UserInfo;
