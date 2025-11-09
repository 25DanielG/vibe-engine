import { useState } from 'react';
import { workflowsApi } from '@/lib/api';

// AI Workflow Hook - Migrated from AWS Amplify to Express API

export function useAgenticWorkflow() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const startWorkflow = async (input: string, workflowType: string) => {
        setIsRunning(true);
        setError(null);
        
        try {
            let response;
            if (workflowType === 'onboarding') {
                response = await workflowsApi.startOnboarding(input);
            } else if (workflowType === 'modification') {
                response = await workflowsApi.startModification(input);
            } else {
                throw new Error(`Unknown workflow type: ${workflowType}`);
            }
            
            if (response?.executionArn) {
                await pollWorkflowStatus(response.executionArn);
            } else {
                // If workflow completes immediately, set result
                if (response?.output) {
                    setResult({
                        status: 'SUCCEEDED',
                        message: response.output.message || 'Workflow completed successfully',
                        commits: response.output.commits || []
                    });
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsRunning(false);
        }
    };

    const pollWorkflowStatus = async (executionArn: string) => {
        const poll = async () => {
            try {
                const statusData = await workflowsApi.getStatus(executionArn);
                    
                setResult(statusData);
                    
                // Continue polling if workflow is still running
                if (statusData.status === 'RUNNING' || (statusData.status === 'SUCCEEDED' && !statusData.output)) {
                    setTimeout(poll, 2000); // Poll every 2 seconds
                } else if (statusData.status === 'SUCCEEDED' && statusData.output) {
                    // Workflow completed, extract output
                    let output;
                    if (typeof statusData.output === 'string') {
                        output = JSON.parse(statusData.output);
                    } else {
                        output = statusData.output;
                    }
                        
                    // Set result with output data
                    setResult({
                        status: 'SUCCEEDED',
                        message: output.message || 'Workflow completed successfully',
                        commits: output.commits || []
                    });
                } else if (statusData.status === 'FAILED') {
                    setError('Workflow execution failed');
                }
            } catch (err) {
                console.error('Error polling workflow status:', err);
                setError(err instanceof Error ? err.message : 'Failed to poll workflow status');
            }
        };
        
        await poll();
    };

    return {
        startWorkflow,
        isRunning,
        result,
        error
    };
}

