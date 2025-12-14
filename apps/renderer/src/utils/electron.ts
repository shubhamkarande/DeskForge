/**
 * Check if we're running in Electron
 */
export const isElectron = (): boolean => {
    return typeof window !== 'undefined' && typeof window.deskforge !== 'undefined';
};

/**
 * Get the DeskForge API if available
 */
export const getApi = () => {
    if (!isElectron()) {
        console.warn('DeskForge API not available - running in browser mode');
        return null;
    }
    return window.deskforge;
};

/**
 * Safe wrapper for fs.selectFolder
 */
export const selectFolder = async (): Promise<string | null> => {
    const api = getApi();
    if (!api) {
        // In browser mode, prompt for a folder name
        const folderName = prompt('Enter workspace name (browser demo mode):');
        return folderName ? `/demo/${folderName}` : null;
    }
    return api.fs.selectFolder();
};
