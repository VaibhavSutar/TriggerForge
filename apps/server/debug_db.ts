
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const workflows = await prisma.workflow.findMany({
        include: { user: true }
    });

    console.log('--- Workflows ---');
    for (const wf of workflows) {
        console.log(`ID: ${wf.id}, Name: ${wf.name}, UserID: ${wf.userId}`);
    }

    const credentials = await prisma.credential.findMany();
    console.log('\n--- Credentials ---');
    for (const cred of credentials) {
        console.log(`ID: ${cred.id}, UserID: ${cred.userId}, Provider: ${cred.provider}`);
    }

    const users = await prisma.user.findMany();
    console.log('\n--- Users ---');
    for (const u of users) {
        console.log(`ID: ${u.id}, Email: ${u.email}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
