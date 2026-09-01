import { createContext, useContext } from 'react'

import { ROLES } from '../config/constants'
import { useAuthContext } from './AuthContext'

const UserRoleContext = createContext(null)

export function UserRoleProvider({ children }) {
  const { user } = useAuthContext()

  const isParent = user?.rol === ROLES.PARENT
  const isAdmin = user?.rol === ROLES.ADMIN

  return (
    <UserRoleContext.Provider value={{ isParent, isAdmin, role: user?.rol }}>
      {children}
    </UserRoleContext.Provider>
  )
}

export function useUserRole() {
  return useContext(UserRoleContext)
}