import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * Check whether a file or directory exists at the given path.
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Compare files between sync repo and local to detect conflicts.
 */
export async function detectConflicts(mappings, syncRepoDir) {
    const results = [];
    for (const mapping of mappings) {
        const remotePath = path.join(syncRepoDir, mapping.syncRepoPath);
        const localPath = mapping.sourcePath;
        const remoteExists = await fileExists(remotePath);
        const localExists = await fileExists(localPath);
        if (remoteExists && !localExists) {
            results.push({
                syncRepoPath: mapping.syncRepoPath,
                localPath,
                remotePath,
                status: 'new',
            });
        }
        else if (!remoteExists && localExists) {
            results.push({
                syncRepoPath: mapping.syncRepoPath,
                localPath,
                remotePath,
                status: 'local-only',
            });
        }
        else if (remoteExists && localExists) {
            try {
                const [localBuf, remoteBuf] = await Promise.all([
                    fs.readFile(localPath),
                    fs.readFile(remotePath),
                ]);
                results.push({
                    syncRepoPath: mapping.syncRepoPath,
                    localPath,
                    remotePath,
                    status: localBuf.equals(remoteBuf) ? 'identical' : 'conflict',
                });
            }
            catch {
                results.push({
                    syncRepoPath: mapping.syncRepoPath,
                    localPath,
                    remotePath,
                    status: 'conflict',
                });
            }
        }
    }
    return results;
}
/**
 * Copy files described by a set of mappings.
 *
 * @param mappings  - Array of FileMapping objects produced by a module's getFiles().
 * @param sourceBase - When direction is 'toSync' this is claudeDir; otherwise syncRepoDir.
 * @param targetBase - When direction is 'toSync' this is syncRepoDir; otherwise claudeDir.
 * @param direction  - 'toSync' copies sourcePath -> syncRepoPath under targetBase.
 *                     'fromSync' copies syncRepoPath under sourceBase -> sourcePath.
 */
export async function copyMappedFiles(mappings, sourceBase, targetBase, direction, skipFiles) {
    const result = {
        copied: [],
        skipped: [],
        errors: [],
    };
    for (const mapping of mappings) {
        if (skipFiles?.has(mapping.syncRepoPath)) {
            result.skipped.push(mapping.syncRepoPath);
            continue;
        }
        let src;
        let dest;
        if (direction === 'toSync') {
            src = mapping.sourcePath;
            dest = path.join(targetBase, mapping.syncRepoPath);
        }
        else {
            src = path.join(sourceBase, mapping.syncRepoPath);
            dest = mapping.sourcePath;
        }
        try {
            const srcExists = await fileExists(src);
            if (!srcExists) {
                result.skipped.push(src);
                continue;
            }
            await fs.mkdir(path.dirname(dest), { recursive: true });
            await fs.copyFile(src, dest);
            result.copied.push(mapping.syncRepoPath);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            result.errors.push(`${mapping.syncRepoPath}: ${message}`);
        }
    }
    return result;
}
//# sourceMappingURL=base-module.js.map