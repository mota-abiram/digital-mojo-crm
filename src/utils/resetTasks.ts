import { db } from '../lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

/**
 * Resets all tasks across all opportunities in the CRM
 * This will remove all tasks from every opportunity
 */
export const resetAllTasks = async (): Promise<{ success: boolean; message: string; count: number }> => {
    try {
        console.log('Starting task reset...');

        // Get all opportunities
        const opportunitiesRef = collection(db, 'opportunities');
        const querySnapshot = await getDocs(opportunitiesRef);

        console.log(`Found ${querySnapshot.size} opportunities to process`);

        // Update each opportunity to remove tasks
        const updatePromises = querySnapshot.docs.map(async (docSnapshot) => {
            const opportunityRef = doc(db, 'opportunities', docSnapshot.id);
            await updateDoc(opportunityRef, {
                tasks: [] // Clear all tasks
            });
        });

        await Promise.all(updatePromises);

        console.log('Task reset completed successfully');

        return {
            success: true,
            message: `Successfully reset tasks for ${querySnapshot.size} opportunities`,
            count: querySnapshot.size
        };
    } catch (error) {
        console.error('Error resetting tasks:', error);
        return {
            success: false,
            message: `Failed to reset tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
            count: 0
        };
    }
};
