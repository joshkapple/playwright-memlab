import * as fs from "fs";
import * as path from "path";
import {Page} from "@playwright/test";


async function captureHeapSnapshot(page: Page, step: number, outputPath: string) {
    console.log("capturing heap!")
    const client = await page.context().newCDPSession(page)
    const dir = path.dirname(outputPath);
    const basePath = './memlab-results'
    const newDir = `${basePath}/${outputPath}`

    console.log(newDir)

    fs.mkdir(newDir, {recursive: true}, (err) => {
        if (err) throw err;
    })

    const chunks = [];

    function dataHandler(data) {
        chunks.push(data.chunk);
    }

    try {
        client.on('HeapProfiler.addHeapSnapshotChunk', dataHandler);
        console.debug(`🚮 Running garbage collection...`);
        //await forceGC(page);
        await client.send('HeapProfiler.enable');
        console.debug(`📸 Capturing heap snapshot to ${newDir}`);
        await client.send('HeapProfiler.takeHeapSnapshot');
        client.removeListener('HeapProfiler.addHeapSnapshotChunk', dataHandler);
        const fullSnapshot = chunks.join('');
        fs.writeFileSync(newDir + `/s${step}.heapsnapshot`, fullSnapshot, {encoding: 'utf-8'});
    } catch (error) {
        console.error('🛑 Error while capturing heap snapshot:', error);
    } finally {
        await client.detach(); // Ensure that the client is detached after the operation
    }
}

export {
    captureHeapSnapshot
}