'use client'

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { setContext } from '@apollo/client/link/context'
import { useAuth } from './auth-context'

export function GraphQLProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth()

    const httpLink = new HttpLink({
        uri: '/api/graphql',
    })

    const authLink = setContext((_, { headers }) => {
        // Get the authentication token from session
        const token = session?.access_token

        // Return the headers to the context so httpLink can read them
        return {
            headers: {
                ...headers,
                authorization: token ? `Bearer ${token}` : '',
            },
        }
    })

    const client = new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
    })

    return <ApolloProvider client={client}>{children}</ApolloProvider>
}
