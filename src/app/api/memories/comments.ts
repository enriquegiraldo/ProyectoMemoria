// src/app/api/memories/comments.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MemoriesService } from '../../../services/memoriesService';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  if (req.method === 'POST') {
    const response = await MemoriesService.createComment({
      ...req.body,
      authorId: session.user.id,
    });
    if (!response.success) {
      return res.status(400).json({ message: response.error });
    }
    if (!response.data || response.data.length === 0) {
      return res.status(500).json({ message: 'Error al crear el comentario' });
    }
    return res.status(200).json(response.data[0]);
  }

  return res.status(405).json({ message: 'Método no permitido' });
}

