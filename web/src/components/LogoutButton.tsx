import React from 'react'
import signOut from '../lib/logout'
import { Button } from '@/components/ui/button'

const LogoutButton = () => (
  <Button onClick={signOut} variant="destructive">
    Log out
  </Button>
)

export default LogoutButton
