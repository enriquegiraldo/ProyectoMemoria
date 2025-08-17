"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UploadModal from "@/components/memorial/UploadModal";

export default function MisMemoriasPage() {
  const [showModal, setShowModal] = useState(false);
  const handleSubmit = (formData: {
    type: string;
    author: string;
    relationship: string;
    content: string;
    imageUrl?: string;
  }) => {
    // Aquí puedes manejar los datos del formulario
    console.log(formData);
    setShowModal(false);
  };

  // Estado para almacenar las memorias
  const [memories, setMemories] = useState([
    {
      id: 1,
      type: "message",
      author: "María Elena Puentes",
      content:
        "Rubén siempre nos enseñó que la vida es un regalo que debemos valorar cada día. Su sonrisa iluminaba cualquier lugar.",
      date: "2024-01-15",
      relationship: "Hermana"
    },
    {
      id: 2,
      type: "photo",
      author: "Carlos Giraldo",
      content: "Nuestro último viaje juntos a la costa",
      imageUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
      date: "2023-12-20",
      relationship: "Primo"
    },
    {
      id: 3,
      type: "message",
      author: "Ana Sofía González",
      content:
        "Recordaré siempre sus consejos y su manera única de ver el mundo. Un hombre extraordinario.",
      date: "2024-01-10",
      relationship: "Amiga"
    }
  ]);

  // Estado para filtrar memorias
  const [filter, setFilter] = useState("all");

  // Memorias filtradas según el tipo seleccionado
  const filteredMemories = memories.filter(
    (memory) => filter === "all" || memory.type === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Memorias</h1>
          <p className="text-gray-600 mt-1">Gestiona tus recuerdos guardados</p>
        </div>
        <Button
          variant="primary"
          onClick={() => (window.location.href = "/dashboard/memorias/nueva")}>
          Crear Nueva Memoria
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2 pb-4">
        <Button
          variant={filter === "all" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}>
          Todos
        </Button>
        <Button
          variant={filter === "message" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("message")}>
          Mensajes
        </Button>
        <Button
          variant={filter === "photo" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("photo")}>
          Fotos
        </Button>
        <button onClick={() => setShowModal(true)}>
          Compartir un Recuerdo
        </button>

        {showModal && (
          <UploadModal
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Lista de memorias */}
      <div className="grid grid-cols-1 gap-6">
        {filteredMemories.length > 0 ? (
          filteredMemories.map((memory) => (
            <Card
              key={memory.id}
              className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {memory.author}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {memory.relationship} • {memory.date}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full text-gray-800">
                      {memory.type === "message" ? "Mensaje" : "Foto"}
                    </span>
                  </div>

                  <p className="mt-4 text-gray-700">{memory.content}</p>

                  {memory.type === "photo" && memory.imageUrl && (
                    <div className="mt-4">
                      <img
                        src={memory.imageUrl}
                        alt={memory.content}
                        className="w-full h-64 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No hay memorias que coincidan con el filtro seleccionado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
