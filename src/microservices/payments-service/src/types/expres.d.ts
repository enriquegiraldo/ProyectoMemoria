// src/microservices/payments-service/src/types/express.d.ts
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
      permissions: string[];
    };
  }
}