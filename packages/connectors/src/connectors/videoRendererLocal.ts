
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import { Connector, ConnectorContext, ConnectorResult } from "../types.js";

const execAsync = promisify(exec);

export const videoRendererLocalConnector: Connector = {
    id: "video_renderer_local",
    name: "Video Renderer (Local FFMPEG)",
    type: "action",

    async run(ctx: ConnectorContext, config: Record<string, any>): Promise<ConnectorResult> {
        const { operation, videoUrls, audioUrl, text, outputName = "reel" } = config;
        const tempDir = path.join(os.tmpdir(), "triggerforge-media");
        await fs.mkdir(tempDir, { recursive: true });

        // Batch detection logic
        const isBatch = Array.isArray(audioUrl) || (Array.isArray(videoUrls) && Array.isArray(videoUrls[0]));
        const batchSize = isBatch ? (Array.isArray(audioUrl) ? audioUrl.length : videoUrls.length) : 1;

        if (isBatch) ctx.logs.push(`[video_renderer_local] Batch mode: Rendering ${batchSize} reels...`);
        else ctx.logs.push(`[video_renderer_local] Single mode detected.`);

        ctx.logs.push(`[video_renderer_local] Config VideoUrls type: ${typeof videoUrls}, isArray: ${Array.isArray(videoUrls)}`);

        const renderSingle = async (vUrls: any, aUrlInput: any, scriptInput: any, idx: number) => {
            const currentOutputName = isBatch ? `${outputName}_${idx}_${Date.now()}.mp4` : `${outputName}_${Date.now()}.mp4`;
            let rendersBase = path.join(process.cwd(), "public", "renders");
            if (!fsSync.existsSync(rendersBase)) {
                rendersBase = path.join(process.cwd(), "apps", "server", "public", "renders");
            }
            await fs.mkdir(rendersBase, { recursive: true });
            const finalOutputPath = path.join(rendersBase, currentOutputName);
            const downloadedVideos: string[] = [];

            // Normalize Input Objects
            let aUrl: string = aUrlInput?.audioUrl || aUrlInput?.path || (typeof aUrlInput === 'string' ? aUrlInput : "");
            let script: string = scriptInput?.script || scriptInput?.text || (typeof scriptInput === 'string' ? scriptInput : "");
            let rawUrls: any = vUrls?.links || vUrls?.link || vUrls;
            if (typeof rawUrls === 'string' && (rawUrls.startsWith("[") || rawUrls.startsWith("{"))) {
                try { rawUrls = JSON.parse(rawUrls); } catch { }
            }
            let urls: any[] = Array.isArray(rawUrls) ? rawUrls : [rawUrls];

            ctx.logs.push(`[video_renderer_local] [idx:${idx}] rawUrls isArray: ${Array.isArray(rawUrls)}, urls length: ${urls.length}`);

            const localTempAudio = path.join(tempDir, `a_${idx}_${Date.now()}.mp3`);
            let srtPath = "";

            try {
                // 1. Audio
                if (aUrl && aUrl !== "undefined" && !aUrl.includes("{{")) {
                    if (fsSync.existsSync(aUrl)) await fs.copyFile(aUrl, localTempAudio);
                    else if (aUrl.startsWith("http")) {
                        const res = await fetch(aUrl);
                        await fs.writeFile(localTempAudio, Buffer.from(await res.arrayBuffer()));
                    }
                }

                // 2. Videos
                const filteredUrls: string[] = urls.map(u => typeof u === 'string' ? u : u?.url || u?.link || u?.src).filter(u => u && (typeof u === 'string' && u.startsWith("http")));
                ctx.logs.push(`[video_renderer_local] [idx:${idx}] filteredUrls length: ${filteredUrls.length}`);
                if (filteredUrls.length > 0) ctx.logs.push(`[video_renderer_local] [idx:${idx}] First filtered URL: ${filteredUrls[0].substring(0, 50)}...`);
                for (let i = 0; i < filteredUrls.length; i++) {
                    const vPath = path.join(tempDir, `v_${idx}_${i}_${Date.now()}.mp4`);
                    const res = await fetch(filteredUrls[i]);
                    await fs.writeFile(vPath, Buffer.from(await res.arrayBuffer()));
                    downloadedVideos.push(vPath);
                }

                if (downloadedVideos.length === 0) throw new Error("No videos for index " + idx);

                const hasAudio = fsSync.existsSync(localTempAudio);
                if (hasAudio && script) {
                    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localTempAudio}"`);
                    const duration = parseFloat(stdout.trim());
                    if (duration > 0) {
                        srtPath = path.join(tempDir, `s_${idx}_${Date.now()}.srt`);
                        const words = script.split(/\s+/).filter(w => w.length > 0);
                        const msPerWord = (duration * 1000) / words.length;
                        let srtContent = "";
                        for (let i = 0; i < words.length; i += 2) {
                            const group = words.slice(i, i + 2);
                            const start = i * msPerWord;
                            const end = Math.min((i + 2) * msPerWord, duration * 1000);
                            const fmt = (ms: number) => {
                                const d = new Date(ms);
                                return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')},${String(d.getUTCMilliseconds()).padStart(3, '0')}`;
                            };
                            srtContent += `${(i / 2) + 1}\n${fmt(start)} --> ${fmt(end)}\n${group.join(" ").toUpperCase()}\n\n`;
                        }
                        await fs.writeFile(srtPath, srtContent);
                    }
                }

                const inputs = downloadedVideos.map(v => `-i "${v}"`).join(" ") + (hasAudio ? ` -i "${localTempAudio}"` : "");
                const filterInputs = downloadedVideos.map((_, i) => `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v${i}];`).join("");
                const concatPart = downloadedVideos.map((_, i) => `[v${i}]`).join("") + `concat=n=${downloadedVideos.length}:v=1:a=0[vbase]`;

                let filterChain = "";
                if (srtPath) {
                    const esc = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");
                    filterChain = `${filterInputs}${concatPart};[vbase]subtitles='${esc}':force_style='FontName=Arial Black,FontSize=20,PrimaryColour=&H0000FFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=3,Shadow=1,Alignment=2,MarginV=60'[vout]`;
                } else {
                    filterChain = `${filterInputs}${concatPart};[vbase]drawtext=text='${script.substring(0, 20)}':fontcolor=yellow:fontsize=20:x=(w-text_w)/2:y=h-150[vout]`;
                }

                const cmd = `ffmpeg -y ${inputs} -filter_complex "${filterChain}" -map "[vout]" ${hasAudio ? `-map ${downloadedVideos.length}:a` : ""} -c:v libx264 -preset ultrafast -pix_fmt yuv420p -shortest "${finalOutputPath}"`;
                await execAsync(cmd);

                return { url: `http://localhost:4000/public/renders/${currentOutputName}`, status: "done" };
            } finally {
                for (const v of downloadedVideos) await fs.unlink(v).catch(() => { });
                if (fsSync.existsSync(localTempAudio)) await fs.unlink(localTempAudio).catch(() => { });
                if (srtPath && fsSync.existsSync(srtPath)) await fs.unlink(srtPath).catch(() => { });
            }
        };

        try {
            const vUrlList = isBatch ? videoUrls : [videoUrls];
            const aUrlList = isBatch ? (Array.isArray(audioUrl) ? audioUrl : [audioUrl]) : [audioUrl];
            const scriptList = isBatch ? (Array.isArray(text) ? text : [text]) : [text];

            const results: any[] = [];
            for (let i = 0; i < batchSize; i++) {
                results.push(await renderSingle(vUrlList[Math.min(i, vUrlList.length - 1)], aUrlList[Math.min(i, aUrlList.length - 1)], scriptList[Math.min(i, scriptList.length - 1)], i));
            }

            return { success: true, output: isBatch ? results : results[0] };
        } catch (e: any) {
            ctx.logs.push(`[video_renderer_local] ERROR: ${e.message}`);
            return { success: false, error: e.message, output: null };
        }
    }
};
