import bcrypt from "bcryptjs";
import { AppError } from "@/lib/api-error";
import { usersRepository } from "@/repositories/users.repository";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/validators/user.schema";

export const usersService = {
  async listUsers() {
    return usersRepository.findAll();
  },

  async createUser(input: CreateUserInput) {
    const parsed = createUserSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("Validation failed", 400, parsed.error.flatten());
    }

    const existingUser = await usersRepository.findByUsername(parsed.data.username);

    if (existingUser) {
      throw new AppError("Username already exists", 409);
    }

    const password_hash = await bcrypt.hash(parsed.data.password, 10);

    return usersRepository.create({
      username: parsed.data.username,
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      password_hash,
      is_active: parsed.data.is_active ?? true,
    });
  },

  async updateUser(input: UpdateUserInput) {
    const parsed = updateUserSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError("Validation failed", 400, parsed.error.flatten());
    }

    const updateData: {
      username: string;
      full_name: string;
      email?: string | null;
      phone?: string | null;
      password_hash?: string;
      is_active: boolean;
    } = {
      username: parsed.data.username,
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      is_active: parsed.data.is_active,
    };

    if (parsed.data.password) {
      updateData.password_hash = await bcrypt.hash(parsed.data.password, 10);
    }

    return usersRepository.update(parsed.data.id, updateData);
  },

  async deleteUser(id: string) {
    if (!id) {
      throw new AppError("User ID is required", 400);
    }

    return usersRepository.delete(id);
  },
};
