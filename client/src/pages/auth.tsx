import { useEffect } from 'react'
import { updateSEO, seoPages } from '@/lib/seo'
import { analytics } from '@/lib/analytics'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import MobileAuthForm from '@/components/mobile-auth-form'

export default function Auth() {
  useEffect(() => {
    updateSEO(seoPages.auth)
    analytics.trackPageView('/auth', 'Login & Register - Viking Chess Online')
  }, [])

  return (
    <>
      <BreadcrumbNav />
      <MobileAuthForm />
    </>
  )
}
