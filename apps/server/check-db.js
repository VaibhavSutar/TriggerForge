import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
    console.log("CREDS:", await p.credential.findMany());
    console.log("WFS:", await p.workflow.findMany({ select: { id: true, userId: true } }));
}
main();
