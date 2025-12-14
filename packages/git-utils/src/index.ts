import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    staged: string[];
    modified: string[];
    untracked: string[];
}

interface GitCommit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: string;
}

interface GitBranch {
    current: string;
    local: string[];
    remote: string[];
}

/**
 * Execute a git command in the specified directory
 */
async function gitExec(repoPath: string, args: string): Promise<string> {
    const { stdout } = await execAsync(`git ${args}`, {
        cwd: repoPath,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large repos
    });
    return stdout.trim();
}

/**
 * Check if a directory is a git repository
 */
export async function isGitRepository(repoPath: string): Promise<boolean> {
    try {
        const gitDir = path.join(repoPath, '.git');
        const stats = await fs.stat(gitDir);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Get the status of a git repository
 */
export async function getStatus(repoPath: string): Promise<GitStatus> {
    const staged: string[] = [];
    const modified: string[] = [];
    const untracked: string[] = [];

    // Get branch info
    const branch = await gitExec(repoPath, 'rev-parse --abbrev-ref HEAD');

    // Get ahead/behind counts
    let ahead = 0;
    let behind = 0;
    try {
        const revList = await gitExec(repoPath, 'rev-list --left-right --count HEAD...@{upstream}');
        const [aheadStr, behindStr] = revList.split('\t');
        ahead = parseInt(aheadStr, 10) || 0;
        behind = parseInt(behindStr, 10) || 0;
    } catch {
        // No upstream set, ignore
    }

    // Get status
    const status = await gitExec(repoPath, 'status --porcelain');

    for (const line of status.split('\n')) {
        if (!line) continue;

        const indexStatus = line[0];
        const workTreeStatus = line[1];
        const file = line.substring(3);

        // Staged changes
        if (indexStatus !== ' ' && indexStatus !== '?') {
            staged.push(file);
        }

        // Modified in work tree
        if (workTreeStatus === 'M' || workTreeStatus === 'D') {
            modified.push(file);
        }

        // Untracked files
        if (indexStatus === '?' && workTreeStatus === '?') {
            untracked.push(file);
        }
    }

    return {
        branch,
        ahead,
        behind,
        staged,
        modified,
        untracked,
    };
}

/**
 * Get commit history
 */
export async function getLog(repoPath: string, limit: number = 50): Promise<GitCommit[]> {
    const format = '%H|%h|%s|%an|%ai';
    const log = await gitExec(repoPath, `log -n ${limit} --format="${format}"`);

    if (!log) return [];

    return log.split('\n').map((line) => {
        const [hash, shortHash, message, author, date] = line.split('|');
        return {
            hash,
            shortHash,
            message,
            author,
            date,
        };
    });
}

/**
 * Get diff for a file or the entire repository
 */
export async function getDiff(repoPath: string, file?: string): Promise<string> {
    const args = file ? `diff -- "${file}"` : 'diff';
    return await gitExec(repoPath, args);
}

/**
 * Get branch information
 */
export async function getBranches(repoPath: string): Promise<GitBranch> {
    // Get current branch
    const current = await gitExec(repoPath, 'rev-parse --abbrev-ref HEAD');

    // Get local branches
    const localOutput = await gitExec(repoPath, 'branch --format="%(refname:short)"');
    const local = localOutput.split('\n').filter(Boolean);

    // Get remote branches
    let remote: string[] = [];
    try {
        const remoteOutput = await gitExec(repoPath, 'branch -r --format="%(refname:short)"');
        remote = remoteOutput.split('\n').filter(Boolean);
    } catch {
        // No remotes configured
    }

    return {
        current,
        local,
        remote,
    };
}

/**
 * Get staged diff
 */
export async function getStagedDiff(repoPath: string): Promise<string> {
    return await gitExec(repoPath, 'diff --cached');
}

/**
 * Get file content at a specific commit
 */
export async function getFileAtCommit(repoPath: string, commit: string, file: string): Promise<string> {
    return await gitExec(repoPath, `show ${commit}:"${file}"`);
}
