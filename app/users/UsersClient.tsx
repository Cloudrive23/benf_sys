"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type User = {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

const emptyForm = {
  id: "",
  username: "",
  full_name: "",
  email: "",
  phone: "",
  password: "",
  is_active: true,
};

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  async function loadUsers() {
    setLoading(true);

    const res = await fetch("/api/users", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setUsers(data.data);
    } else {
      toast.error(data.message || "Failed to load users");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const text = `${user.username} ${user.full_name} ${user.email || ""} ${user.phone || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  function openCreateDialog() {
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(user: User) {
    setForm({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      is_active: Boolean(user.is_active),
    });

    setDialogOpen(true);
  }

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const method = form.id ? "PUT" : "POST";

    const res = await fetch("/api/users", {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message);
      setDialogOpen(false);
      await loadUsers();
    } else {
      toast.error(data.message || "Save failed");
    }

    setSaving(false);
  }

  function openDeleteDialog(user: User) {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  }

  async function deleteUser() {
    if (!selectedUser) return;

    const res = await fetch(`/api/users?id=${selectedUser.id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } else {
      toast.error(data.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system users and access accounts
          </p>
        </div>

        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Users</CardTitle>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "destructive"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={saveUser} className="space-y-4">
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
              required
            />

            <Input
              placeholder="Full Name"
              value={form.full_name}
              onChange={(e) =>
                setForm({ ...form, full_name: e.target.value })
              }
              required
            />

            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />

            <Input
              type="password"
              placeholder={form.id ? "New Password (optional)" : "Password"}
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required={!form.id}
            />

            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              <label htmlFor="is_active" className="text-sm">
                Active user
              </label>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete user?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the selected user.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
