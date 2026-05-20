import { prisma } from "../lib/prisma";
import AppLayout from "../components/AppLayout";

export const dynamic = "force-dynamic";

export default async function UsersPage() {

  const users = await prisma.users.findMany({
    orderBy: {
      created_at: "desc",
    },
  });

  return (
    <AppLayout className="min-h-screen bg-gray-950 text-white p-10">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            Users Management
          </h1>

          <p className="text-gray-400 mt-2">
            Manage system users
          </p>
        </div>

        <a href="/users/new" className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl">
  Add User
</a>

      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-800">

            <tr className="text-left">

              <th className="p-4">Username</th>
              <th className="p-4">Full Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>

            </tr>

          </thead>

          <tbody>

            {users.map((user) => (

              <tr
                key={user.id}
                className="border-t border-gray-800 hover:bg-gray-800/40"
              >

                <td className="p-4">
                  {user.username}
                </td>

                <td className="p-4">
                  {user.full_name}
                </td>

                <td className="p-4">
                  {user.email}
                </td>

                <td className="p-4">

                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      user.is_active
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>

                </td>
                <td className="space-y-2">
  <button className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-black">
    Edit
  </button>

  <form action="/api/users/delete" method="post">
    <input type="hidden" name="id" value={user.id} />

    <button className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
      Delete
    </button>
  </form>
</td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </AppLayout>
  );
}