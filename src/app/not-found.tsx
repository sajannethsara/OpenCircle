import Link from 'next/link'

export default function Custom404() {
  return (
    <div style={{ textAlign: 'center', marginTop: '10%' }}>
      <h1>404 - Page Not Found</h1>
      <Link href="/">Go Back Home</Link>
    </div>
  )
}