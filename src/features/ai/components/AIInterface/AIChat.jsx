export default function AIChat({ parseMessage }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
      parseMessage.includes('Successfully') || parseMessage.includes('Copied')
        ? 'border-teal-200 bg-teal-50 text-teal-800'
        : 'border-rose-200 bg-rose-50 text-rose-800'
    }`}>
      {parseMessage}
    </div>
  )
}
