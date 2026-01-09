'use client'

import { AuthProvider } from '@/lib/auth-context'
import { GraphQLProvider } from '@/lib/apollo-provider'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <GraphQLProvider>
                {children}
            </GraphQLProvider>
        </AuthProvider>
    )
}
