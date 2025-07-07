const { PrismaClient } = require("./src/generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "admin@test.com",
      name: "Administrateur",
      password: hashedPassword,
    },
  });

  console.log("Utilisateur créé/mis à jour:", user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
