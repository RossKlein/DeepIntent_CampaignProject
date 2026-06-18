export function LoadingMessage({ label = 'Loading...' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
      {label}
    </div>
  )
}

export function ErrorMessage({ message }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}
