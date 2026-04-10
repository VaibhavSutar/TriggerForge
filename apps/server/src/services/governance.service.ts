
import { prisma } from "../prisma";

export class GovernanceService {
    // In a real implementation, this would be injected with PrismaClient
    constructor() { }

    async generateSafetyReport(workflowId: string): Promise<any> {
        console.log(`[GovernanceService] Generating safety report for workflow ${workflowId}`);

        try {
            // First, find logs that haven't been safety-scored yet
            const unanalyzedLogs = await prisma.aILog.findMany({
                where: {
                    workflowId,
                    safetyScore: null
                }
            });

            // Analyze them in parallel to ensure the report is up to date
            if (unanalyzedLogs.length > 0) {
                console.log(`[GovernanceService] Analyzing ${unanalyzedLogs.length} unscored logs...`);
                await Promise.all(unanalyzedLogs.map(log =>
                    this.analyzeLog(log.id, `${log.inputPrompt} ${log.outputResponse}`)
                ));
            }

            const logs = await prisma.aILog.findMany({
                where: { workflowId }
            });

            const totalRuns = logs.length;
            const flaggedRuns = logs.filter(l => l.flagged).length;

            // Calculate average safety score if available, default to 1.0
            const totalScore = logs.reduce((sum, log) => sum + (log.safetyScore ?? 1.0), 0);
            const avgScore = totalRuns > 0 ? totalScore / totalRuns : 0.0;

            const report = await prisma.safetyReport.create({
                data: {
                    workflowId,
                    totalRuns,
                    flaggedRuns,
                    avgScore,
                    generatedAt: new Date()
                }
            });

            return report;
        } catch (error) {
            console.error("[GovernanceService] Error generating report:", error);
            // Fallback mock if DB fails (for resilience)
            return {
                id: "report_fallback_" + Date.now(),
                workflowId,
                totalRuns: 0,
                flaggedRuns: 0,
                avgScore: 0,
                error: (error as Error).message
            };
        }
    }

    async analyzeLog(logId: string, content: string): Promise<number> {
        // Simple heuristic for safety score
        const unsafeKeywords = [
            "hack", "exploit", "attack", "ignore previous instructions",
            "bypass safety", "root access", "sudo", "exfiltrate",
            "leak credit card", "ssn", "password", "proxy bypass",
            "harmful", "illegal", "toxic"
        ];
        const found = unsafeKeywords.filter(k => content.toLowerCase().includes(k));

        let score = 0.95;
        let flagged = false;

        if (found.length > 0) {
            console.warn(`[GovernanceService] Log ${logId} flagged for keywords: ${found.join(", ")}`);
            score = 0.1; // Low safety score
            flagged = true;
        }

        // Update the log entry with the score
        try {
            await prisma.aILog.update({
                where: { id: logId },
                data: { safetyScore: score, flagged }
            });
        } catch (e) {
            console.error("[GovernanceService] Failed to update log score:", e);
        }

        return score;
    }
}
