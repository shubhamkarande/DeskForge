"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGitRepository = isGitRepository;
exports.getStatus = getStatus;
exports.getLog = getLog;
exports.getDiff = getDiff;
exports.getBranches = getBranches;
exports.getStagedDiff = getStagedDiff;
exports.getFileAtCommit = getFileAtCommit;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Execute a git command in the specified directory
 */
async function gitExec(repoPath, args) {
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
async function isGitRepository(repoPath) {
    try {
        const gitDir = path.join(repoPath, '.git');
        const stats = await fs.stat(gitDir);
        return stats.isDirectory();
    }
    catch {
        return false;
    }
}
/**
 * Get the status of a git repository
 */
async function getStatus(repoPath) {
    const staged = [];
    const modified = [];
    const untracked = [];
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
    }
    catch {
        // No upstream set, ignore
    }
    // Get status
    const status = await gitExec(repoPath, 'status --porcelain');
    for (const line of status.split('\n')) {
        if (!line)
            continue;
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
async function getLog(repoPath, limit = 50) {
    const format = '%H|%h|%s|%an|%ai';
    const log = await gitExec(repoPath, `log -n ${limit} --format="${format}"`);
    if (!log)
        return [];
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
async function getDiff(repoPath, file) {
    const args = file ? `diff -- "${file}"` : 'diff';
    return await gitExec(repoPath, args);
}
/**
 * Get branch information
 */
async function getBranches(repoPath) {
    // Get current branch
    const current = await gitExec(repoPath, 'rev-parse --abbrev-ref HEAD');
    // Get local branches
    const localOutput = await gitExec(repoPath, 'branch --format="%(refname:short)"');
    const local = localOutput.split('\n').filter(Boolean);
    // Get remote branches
    let remote = [];
    try {
        const remoteOutput = await gitExec(repoPath, 'branch -r --format="%(refname:short)"');
        remote = remoteOutput.split('\n').filter(Boolean);
    }
    catch {
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
async function getStagedDiff(repoPath) {
    return await gitExec(repoPath, 'diff --cached');
}
/**
 * Get file content at a specific commit
 */
async function getFileAtCommit(repoPath, commit, file) {
    return await gitExec(repoPath, `show ${commit}:"${file}"`);
}
//# sourceMappingURL=index.js.map