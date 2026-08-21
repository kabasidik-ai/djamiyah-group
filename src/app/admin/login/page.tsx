import { LoginForm } from './LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Espace Staff</h1>
          <p className="mt-2 text-sm text-gray-600">Djamiyah Group — Administration</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
