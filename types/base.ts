export type AuditFields = {
  created_at?: Date | string | null;
  updated_at?: Date | string | null;

  created_by?: string | null;
  updated_by?: string | null;

  deleted_at?: Date | string | null;
  deleted_by?: string | null;

  is_deleted?: boolean | null;
  is_active?: boolean | null;
};

export type BaseEntity = {
  id: string;
} & AuditFields;

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  count: number;
};

export type ApiItemResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};