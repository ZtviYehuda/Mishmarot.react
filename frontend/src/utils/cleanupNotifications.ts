// Clean up old localStorage notification reads
// This script should be run once to migrate from localStorage to server-side tracking

export function cleanupOldNotificationStorage() {
    try {
        localStorage.removeItem('read_notifications');
        console.log('✅ Cleaned up old notification storage');
    } catch (e) {
        console.error('Failed to cleanup notification storage:', e);
    }
}

// Auto-run on import
if (typeof window !== 'undefined') {
    cleanupOldNotificationStorage();
}
