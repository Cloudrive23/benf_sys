"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const pageSize = 10;

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
      toast.error(data.message || "تعذر تحميل المستخدمين");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const text = `${user.username} ${user.full_name} ${user.email || ""} ${
        user.phone || ""
      }`.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const pagedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

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
      toast.success(data.message || "تم الحفظ بنجاح");
      setDialogOpen(false);
      await loadUsers();
    } else {
      toast.error(data.message || "تعذر حفظ البيانات");
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
      toast.success(data.message || "تم الحذف بنجاح");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } else {
      toast.error(data.message || "تعذر حذف المستخدم");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            إدارة حسابات مستخدمي النظام والصلاحيات الأساسية
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          style={{
            backgroundColor: "var(--app-primary)",
            color: "white",
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة مستخدم
        </Button>
      </div>

      <Card
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <CardHeader className="space-y-4">
          <CardTitle>قائمة المستخدمين</CardTitle>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
            <Input
              placeholder="بحث عن مستخدم..."
              className="pr-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>الاسم الكامل</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      جاري تحميل المستخدمين...
                    </TableCell>
                  </TableRow>
                ) : pagedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8"
                      style={{ color: "var(--app-muted)" }}
                    >
                      لا توجد بيانات
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "destructive"}>
                          {user.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left space-x-2 space-x-reverse">
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

          <div className="flex items-center justify-between mt-4 text-sm">
            <div style={{ color: "var(--app-muted)" }}>
              إجمالي النتائج: {filteredUsers.length}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </Button>

              <span>
                صفحة {page} من {totalPages}
              </span>

              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                التالي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={saveUser} className="space-y-4">
            <Input
              placeholder="اسم المستخدم"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
              required
            />

            <Input
              placeholder="الاسم الكامل"
              value={form.full_name}
              onChange={(e) =>
                setForm({ ...form, full_name: e.target.value })
              }
              required
            />

            <Input
              placeholder="البريد الإلكتروني"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <Input
              placeholder="رقم الهاتف"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />

            <Input
              type="password"
              placeholder={form.id ? "كلمة مرور جديدة اختياريًا" : "كلمة المرور"}
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
                مستخدم نشط
              </label>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "جاري الحفظ..." : "حفظ البيانات"}
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
            <AlertDialogTitle>حذف المستخدم؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المستخدم المحدد نهائيًا من النظام. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
