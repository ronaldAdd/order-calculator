export default function Loading() {
  return (
    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
      <svg
        className="animate-spin mx-auto h-6 w-6 text-blue-600 dark:text-blue-300 mb-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
      Loading...
    </div>
  )
}
