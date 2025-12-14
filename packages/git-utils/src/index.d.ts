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
 * Check if a directory is a git repository
 */
export declare function isGitRepository(repoPath: string): Promise<boolean>;
/**
 * Get the status of a git repository
 */
export declare function getStatus(repoPath: string): Promise<GitStatus>;
/**
 * Get commit history
 */
export declare function getLog(repoPath: string, limit?: number): Promise<GitCommit[]>;
/**
 * Get diff for a file or the entire repository
 */
export declare function getDiff(repoPath: string, file?: string): Promise<string>;
/**
 * Get branch information
 */
export declare function getBranches(repoPath: string): Promise<GitBranch>;
/**
 * Get staged diff
 */
export declare function getStagedDiff(repoPath: string): Promise<string>;
/**
 * Get file content at a specific commit
 */
export declare function getFileAtCommit(repoPath: string, commit: string, file: string): Promise<string>;
export {};
//# sourceMappingURL=index.d.ts.map