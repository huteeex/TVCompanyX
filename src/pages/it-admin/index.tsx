import { useEffect } from 'react'
import { useRouter } from 'next/router'

const ITAdminIndex = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace('/it-admin/dashboard')
  }, [])

  return null
}

export default ITAdminIndex
