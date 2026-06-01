export function buildSoftDeleteData(userId?: string | null) {
  return {
    is_deleted: true,
    deleted_at: new Date(),
    deleted_by: userId || null,
    is_active: false,
  };
}

export function activeWhere() {
  return {
    is_deleted: false,
  };
}