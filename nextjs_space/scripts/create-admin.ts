import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'marc@thinkrconsulting.be';
  const password = 'Tyson69413012';
  const name = 'Marc';
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      password: hashedPassword, 
      role: 'ADMIN',
      name,
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  
  console.log(`✅ Admin user created/updated: ${user.email} (role: ${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
