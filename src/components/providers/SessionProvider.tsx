//src/components/providers/SessionProvider.tsx
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
}


// asumiré que usa Supabase Auth, ya que notificationService.ts 
// interactúa con Supabase. Para resolver esta discrepancia, sugiero cambiar SessionProvider 
// a Supabase Auth para que sea consistente con notificationService.ts. Aquí está la versión actualizada:

// // // src/components/providers/SessionProvider.tsx
// 'use client';

// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import { SessionContextProvider } from '@supabase/auth-helpers-react';
// import { ReactNode } from 'react';

// interface SessionProviderProps {
//   children: ReactNode;
// }

// export default function SessionProvider({ children }: SessionProviderProps) {
//   const supabase = createClientComponentClient();
//   return (
//     <SessionContextProvider supabaseClient={supabase}>
//       {children}
//     </SessionContextProvider>
//   );
// }


// Y actualiza useAuth.ts para usar Supabase:
// typescript// src/hooks/useAuth.ts
// 'use client';

// import { useSessionContext } from '@supabase/auth-helpers-react';

// export function useAuth() {
//   const { session, isLoading } = useSessionContext();
//   return {
//     user: session?.user ?? null,
//     isLoading,
//     isAuthenticated: !!session,
//   };
// }