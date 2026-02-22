
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const targetUserId = '3e1a3293-a324-48e7-a730-6d777e303b9c'; // UserID from debug log

    // Find orphan credentials (or those under 'test-user-id')
    const orphanCreds = await prisma.credential.findMany({
        where: { userId: 'test-user-id', provider: 'google' }
    });

    console.log(`Found ${orphanCreds.length} credentials for 'test-user-id'. Moving to ${targetUserId}`);

    for (const cred of orphanCreds) {
        // Check if target user already has creds
        const exists = await prisma.credential.findFirst({
            where: { userId: targetUserId, provider: 'google' }
        });

        if (exists) {
            console.log("Target user already has creds. Updating token.");
            await prisma.credential.update({
                where: { id: exists.id },
                data: {
                    accessToken: cred.accessToken,
                    refreshToken: cred.refreshToken,
                    expiresAt: cred.expiresAt
                }
            });
            // Delete old
            await prisma.credential.delete({ where: { id: cred.id } });
        } else {
            console.log("Assigning cred to target user.");
            await prisma.credential.update({
                where: { id: cred.id },
                data: { userId: targetUserId }
            });
        }
    }

    // Also check if there are other mis-assigned workflows
    const testUserWorkflows = await prisma.workflow.findMany({ where: { userId: 'test-user-id' } });
    console.log(`Found ${testUserWorkflows.length} workflows for 'test-user-id'. Moving them too just in case.`);

    for (const wf of testUserWorkflows) {
        // Move workflow ownership
        await prisma.workflow.update({
            where: { id: wf.id },
            data: { userId: targetUserId }
        });
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
