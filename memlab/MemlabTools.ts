import * as fs from "fs";
import * as path from "path";
import {CDPSession, Page} from "@playwright/test";
import {test as base} from '@playwright/test';
import {utils} from '@memlab/core';

type MemlabFixture = {
    memlabTool: MemlabTool
}

class MemlabTool {
    page: Page
    cdpSession?: CDPSession

    constructor(page: Page) {
        this.page = page
    }

    async getCDPSession(): Promise<CDPSession> {
        if (!this.cdpSession) {
            this.cdpSession = await this.page.context().newCDPSession(this.page)
        }
        return this.cdpSession;
    }

    clearCDPSession(): void {
        this.cdpSession = null;
    }

    checkLastSnapshotChunk(chunk: string): void {
        const regex = /\}\s*$/;
        if (!regex.test(chunk)) {
            utils.throwError(
                new Error(
                    'resolved `HeapProfiler.takeHeapSnapshot` before writing the last chunk',
                ),
            );
        }
    }

    async startTrackingHeap(): Promise<void> {
        const session = await this.getCDPSession()
        session.send("HeapProfiler.enable")
    }

    /**
     *
     * @param snapshotNumber - where 1 = SBP, 2 = STP, 3 = FP
     * @param outputPath
     */
    async captureHeapSnapshot(snapshotNumber, outputPath): Promise<void> {
        console.log("capturing heap!")

        const basePath = './memlab-results'
        const newDir = `${basePath}/${outputPath}`

        const session: CDPSession = await this.getCDPSession()

        console.log(newDir)

        fs.mkdir(newDir, {recursive: true}, (err) => {
            if (err) throw err;
        })

        const writeStream: fs.WriteStream = fs.createWriteStream(newDir + `/s${snapshotNumber}.heapsnapshot`, {encoding: 'utf-8'});

        let lastChunk = '';
        const dataHandler = (data: { chunk: string }) => {
            writeStream.write(data.chunk);
            lastChunk = data.chunk;
        };

        session.on('HeapProfiler.addHeapSnapshotChunk', dataHandler);

        //console.debug(`🚮 Running garbage collection...`);
        //await forceGC(page);

        await session.send('HeapProfiler.enable');
        console.debug(`📸 Capturing heap snapshot ${snapshotNumber} to ${newDir}`);

        await session.send('HeapProfiler.takeHeapSnapshot');

        this.checkLastSnapshotChunk(lastChunk);

        session.removeListener('HeapProfiler.addHeapSnapshotChunk', dataHandler);

        writeStream.end();
    }
}

export const memlabTest = base.extend<MemlabFixture>({
    memlabTool: async ({page}, use) => {
        const memlabTools = new MemlabTool(page)
        await use(memlabTools)
    }
})