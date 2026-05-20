export default function NewUserPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-10">
      <h1 className="text-4xl font-bold mb-8">Add New User</h1>

      <form
        action="/api/users"
        method="post"
        className="max-w-xl bg-gray-900 p-8 rounded-2xl border border-gray-800 space-y-5"
      >
        <input name="username" placeholder="Username" className="w-full p-3 rounded bg-gray-800" required />
        <input name="full_name" placeholder="Full Name" className="w-full p-3 rounded bg-gray-800" required />
        <input name="email" placeholder="Email" className="w-full p-3 rounded bg-gray-800" />
        <input name="phone" placeholder="Phone" className="w-full p-3 rounded bg-gray-800" />
        <input name="password" placeholder="Password" type="password" className="w-full p-3 rounded bg-gray-800" />

        <button className="bg-blue-600 px-5 py-3 rounded-xl">
          Save User
        </button>
      </form>
    </main>
  );
}