// src/app/api/memories/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MemoriesService } from '../../../services/memoriesService';
import { getSession } from 'next-auth/react'; // Asumiendo uso de next-auth para autenticación

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const response = await MemoriesService.updateMemory(id as string, {
      ...req.body,
      authorId: session.user.id,
    });
    if (!response.success) {
      return res.status(400).json({ message: response.error });
    }
    return res.status(200).json(response.data);
  }

  if (req.method === 'DELETE') {
    const response = await MemoriesService.deleteMemory(id as string);
    if (!response.success) {
      return res.status(400).json({ message: response.error });
    }
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const response = await MemoriesService.getMemoryById(id as string);
    if (!response.success) {
      return res.status(400).json({ message: response.error });
    }
    return res.status(200).json(response.data);
  }

  return res.status(405).json({ message: 'Método no permitido' });
}