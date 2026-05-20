import { prisma } from "@/app/lib/prisma";

export const usersRepository = {
  findAll() {
    return prisma.users.findMany({
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        phone: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },

  findByUsername(username: string) {
    return prisma.users.findFirst({
      where: {
        username,
      },
    });
  },

  create(data: {
    username: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    password_hash: string;
    is_active?: boolean;
  }) {
    return prisma.users.create({
      data,
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        phone: true,
        is_active: true,
        created_at: true,
      },
    });
  },

  update(
    id: string,
    data: {
      username: string;
      full_name: string;
      email?: string | null;
      phone?: string | null;
      password_hash?: string;
      is_active: boolean;
    }
  ) {
    return prisma.users.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        phone: true,
        is_active: true,
        created_at: true,
      },
    });
  },

  delete(id: string) {
    return prisma.users.delete({
      where: {
        id,
      },
    });
  },
};
