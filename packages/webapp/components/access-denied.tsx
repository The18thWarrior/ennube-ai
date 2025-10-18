

export default function AccessDenied() {
  return (
    <>
      <h1>Access Denied</h1>
      <p>
        <a
          href="/auth/login"
          onClick={(e) => {
            e.preventDefault()
            
          }}
        >
          You must be signed in to view this page
        </a>
      </p>
    </>
  )
}
