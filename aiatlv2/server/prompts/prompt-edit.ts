import { Type } from '@google/genai';

export default [
    {
    name: 'update_file',
    description: 'Function that allows an AI Agent to modify the contents of a specific file in a GitHub repository.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            content: { type: Type.STRING, description: 'The content of the file that is being updated' },
        },
        required: ['content'],
    },
    }
];