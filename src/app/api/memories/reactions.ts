// src/app/api/memories/reactions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MemoriesService } from '../../../services/memoriesService';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  if (req.method === 'POST') {
    const { type, referenceId, referenceType } = req.body;
    const response = await MemoriesService.addReaction(
      type,
      session.user.id,
      referenceId,
      referenceType
    );
    if (!response.success) {
      return res.status(400).json({ message: response.error });
    }
    return res.status(200).json(response.data[0]);
  }

  return res.status(405).json({ message: 'Método no permitido' });
}