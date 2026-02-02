import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const id = 'test-user-id';
    console.log(`Ensuring user '${id}' exists...`);

    // Simple hash for "password"
    const passwordHash = await bcrypt.hash('password', 10);

    const user = await prisma.user.upsert({
        where: { id },
        update: {},
        create: {
            id,
            email: 'test@example.com',
            passwordHash,
            name: 'Dev User',
            credits: 1000,
            plan: 'free'
        }
    });

    console.log(`✅ User ensured: ${user.id} (${user.email})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
