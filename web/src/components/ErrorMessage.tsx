type ErrorMessageProps = {
  message: string
}

const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <div className="bg-red-100 text-red-700 p-4 rounded-md">
      <h3 className="font-bold">Error</h3>
      <p>{message}</p>
      <p>Please try again later or contact support if the issue persists.</p>
    </div>
  )
}

export default ErrorMessage
