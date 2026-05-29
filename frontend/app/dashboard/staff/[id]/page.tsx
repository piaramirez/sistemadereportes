"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

export default function StaffDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:8000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    };
    fetchUser();
  }, [id]);

  const resetPass = async () => {
    if (confirm("¿Restablecer contraseña a Unam26!#?")) {
      await axios.post(
        `http://localhost:8000/api/users/${id}/reset-password`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert("Contraseña restablecida.");
    }
  };

  if (!user) return <div>Cargando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#002B7A]">{user.name}</h1>
          <p className="text-slate-500">{user.email}</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={resetPass}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold"
          >
            Reset Pass
          </button>
          <button
            onClick={() => {
              axios.delete(`http://localhost:8000/api/users/${id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              });
              router.push("/dashboard/staff");
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
