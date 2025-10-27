// components/Spinner.tsx
export default function Spinner() {
  return (
    <div className="flex justify-center items-center h-24">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500 dark:border-gray-600 dark:border-t-blue-400" />
    </div>
  )
}
