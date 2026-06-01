"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Branch = {
  id: string;
  branch_code: string;
  branch_name_ar: string;
};

type Lookup = {
  id: string;
  name_ar: string;
};

type Father = {
  id: string;
  father_code: string;
  branch_id: string;
  full_name_ar: string;
  full_name_en?: string | null;
  identity_number?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  death_reason_id?: string | null;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
};

const emptyForm = {
  id: "",
  father_code: "",
  branch_id: "",
  full_name_ar: "",
  full_name_en: "",
  identity_number: "",
  birth_date: "",
  death_date: "",
  death_reason_id: "",
  phone: "",
  address: "",
  occupation: "",
  occupation_id: "",
  notes: "",
  is_active: true,
};

export default function FathersClient() {
  const [items, setItems] = useState<Father[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [deathReasons, setDeathReasons] = useState<Lookup[]>([]);
  const [occupations, setOccupations] = useState<Lookup[]>([]);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/fathers", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    } else {
      toast.error(data.message || "تعذر تحميل بيانات الآباء");
    }
  }

  async function loadBranches() {
    const res = await fetch("/api/org/branches", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setBranches(data.data || []);
    }
  }

  async function loadDeathReasons() {
			const res = await fetch("/api/lookups?type=death_reasons", {
			  cache: "no-store",
			});

			const data = await res.json();

			if (data.success) {
			  setDeathReasons(data.data || []);
			}
		  }
			async function loadOccupations() {
		  const res = await fetch("/api/lookups?type=occupations", {
			cache: "no-store",
		  });

		  const data = await res.json();

		  if (data.success) {
			setOccupations(data.data || []);
		  }
		}
  async function loadNextCode() {
    const res = await fetch("/api/fathers/next-code", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setForm((old) => ({
        ...old,
        father_code: data.data.father_code,
      }));
    }
  }

  useEffect(() => {
    load();
    loadBranches();
    loadDeathReasons();
	loadOccupations();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) =>
      `
      ${item.father_code}
      ${item.full_name_ar}
      ${item.identity_number || ""}
      ${item.phone || ""}
      `
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  function getBranchName(id: string) {
    return branches.find((b) => b.id === id)?.branch_name_ar || "-";
  }

  function getDeathReasonName(id?: string | null) {
    if (!id) return "-";
    return deathReasons.find((x) => x.id === id)?.name_ar || "-";
  }

  async function openCreate() {
    if (branches.length === 0) {
      toast.error("يجب إضافة فرع أولًا");
      return;
    }

    setForm({
      ...emptyForm,
      branch_id: branches[0]?.id || "",
    });

    setOpen(true);

    await loadNextCode();
  }

  function openEdit(item: Father) {
    setForm({
      id: item.id,
      father_code: item.father_code,
      branch_id: item.branch_id,
      full_name_ar: item.full_name_ar || "",
      full_name_en: item.full_name_en || "",
      identity_number: item.identity_number || "",
      birth_date: item.birth_date ? item.birth_date.slice(0, 10) : "",
      death_date: item.death_date ? item.death_date.slice(0, 10) : "",
      death_reason_id: item.death_reason_id || "",
      phone: item.phone || "",
      address: item.address || "",
      occupation: item.occupation || "",
	  occupation_id: (item as any).occupation_id || "",
      notes: item.notes || "",
      is_active: item.is_active ?? true,
    });

    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!form.branch_id) {
      toast.error("يجب اختيار الفرع");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/fathers", {
      method: form.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحفظ بنجاح");

      setOpen(false);
      setForm(emptyForm);

      await load();
    } else {
      toast.error(data.message || "تعذر حفظ البيانات");
    }

    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("هل أنت متأكد من حذف سجل الأب؟")) return;

    const res = await fetch(`/api/fathers?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحذف بنجاح");

      await load();
    } else {
      toast.error(data.message || "تعذر الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">إدارة الآباء</h1>

          <p
            className="text-sm mt-1"
            style={{ color: "var(--app-muted)" }}
          >
            إدارة بيانات الآباء وربطهم بالفروع
          </p>
        </div>

        <Button
          onClick={openCreate}
          style={{
            backgroundColor: "var(--app-primary)",
            color: "white",
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة أب
        </Button>

      </div>

      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >

        <div className="relative max-w-lg">
          <Search className="absolute right-3 top-3 w-4 h-4 opacity-60" />

          <Input
            className="pr-10"
            placeholder="بحث بالاسم، الرقم، الهوية، الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm border-collapse">

            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--app-border)" }}
              >
                <th className="p-3 text-right">رقم الأب</th>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">الفرع</th>
                <th className="p-3 text-right">الهوية</th>
                <th className="p-3 text-right">تاريخ الوفاة</th>
                <th className="p-3 text-right">سبب الوفاة</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-left">الإجراءات</th>
              </tr>
            </thead>

            <tbody>

              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center"
                    style={{ color: "var(--app-muted)" }}
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <td className="p-3">{item.father_code}</td>
                    <td className="p-3">{item.full_name_ar}</td>
                    <td className="p-3">{getBranchName(item.branch_id)}</td>
                    <td className="p-3">{item.identity_number || "-"}</td>
                    <td className="p-3">
                      {item.death_date
                        ? item.death_date.slice(0, 10)
                        : "-"}
                    </td>
                    <td className="p-3">
                      {getDeathReasonName(item.death_reason_id)}
                    </td>
                    <td className="p-3">
                      <Badge>
                        {item.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </td>
                    <td className="p-3 text-left space-x-2 space-x-reverse">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => remove(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

      <BaseModal
        open={open}
        title={form.id ? "تعديل بيانات الأب" : "إضافة أب"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm">رقم الأب</label>
              <Input readOnly value={form.father_code} />
            </div>

            <div>
              <label className="text-sm">الفرع</label>
              <select
                required
                className="w-full rounded-md border bg-transparent p-2"
                value={form.branch_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    branch_id: e.target.value,
                  })
                }
              >
                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.branch_name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm">الاسم العربي</label>
              <Input
                required
                value={form.full_name_ar}
                onChange={(e) =>
                  setForm({
                    ...form,
                    full_name_ar: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm">الاسم الإنجليزي</label>
              <Input
                value={form.full_name_en}
                onChange={(e) =>
                  setForm({
                    ...form,
                    full_name_en: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm">رقم الهوية</label>
              <Input
                value={form.identity_number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    identity_number: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm">تاريخ الميلاد</label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    birth_date: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm">تاريخ الوفاة</label>
              <Input
                type="date"
                value={form.death_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    death_date: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm">سبب الوفاة</label>
              <select
                className="w-full rounded-md border bg-transparent p-2"
                value={form.death_reason_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    death_reason_id: e.target.value,
                  })
                }
              >
                <option value="">اختر سبب الوفاة</option>
                {deathReasons.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm">الهاتف</label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            <div>
			  <label className="text-sm">المهنة</label>

			  <select
				className="w-full rounded-md border bg-transparent p-2"
				value={form.occupation_id}
				onChange={(e) =>
				  setForm({
					...form,
					occupation_id: e.target.value,
				  })
				}
			  >
				<option value="">اختر المهنة</option>

				{occupations.map((item) => (
				  <option key={item.id} value={item.id}>
					{item.name_ar}
				  </option>
				))}
			  </select>
			</div>

            <div className="md:col-span-2">
              <label className="text-sm">العنوان</label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                  })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm">ملاحظات</label>
              <Input
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
              />
            </div>

          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_active: e.target.checked,
                })
              }
            />
            نشط
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>

        </form>
      </BaseModal>
    </div>
  );
}