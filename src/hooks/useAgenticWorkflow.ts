import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient<Schema>();

// AI Workflow Hook

export function useAgenticWorkflow() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const startWorkflow = async (input: string, workflowType: string) => {
        setIsRunning(true);
        setError(null);
        
        try {
            const response = await client.queries.agenticWorkflow({
                input,
                workflowType
            });
            
            const data = response.data as any;
            if (data?.executionArn) {
                await pollWorkflowStatus(data.executionArn);
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
                const statusResponse = await client.queries.getWorkflowStatus({
                    executionArn
                });
                
                if (statusResponse.data) {
                    let statusData;
                    if (typeof statusResponse.data === 'string') {
                        statusData = JSON.parse(statusResponse.data);
                    } else {
                        statusData = statusResponse.data;
                    }
                    
                    setResult(statusData);
                    
                    // Continue polling if workflow is still running
                    if (statusData.status === 'RUNNING' || statusData.status === 'SUCCEEDED' && !statusData.output) {
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