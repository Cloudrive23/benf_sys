import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingBranch = await prisma.branches.findFirst({
    where: {
      branch_code: "MAIN",
    },
  });

  if (existingBranch) {
    const existingSite = await prisma.sites.findFirst({
      where: {
        site_code: "MAIN",
        branch_id: existingBranch.id,
      },
    });

    console.log("Branch:", existingBranch.id);
    console.log("Site:", existingSite?.id);
    return;
  }

  const branch = await prisma.branches.create({
    data: {
      branch_code: "MAIN",
      branch_name_ar: "الفرع الرئيسي",
      branch_name_en: "Main Branch",
      is_active: true,
    },
  });

  const site = await prisma.sites.create({
    data: {
      site_code: "MAIN",
      site_name_ar: "الموقع الرئيسي",
      site_name_en: "Main Site",
      branch_id: branch.id,
      is_active: true,
    },
  });

  console.log("Branch:", branch.id);
  console.log("Site:", site.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
