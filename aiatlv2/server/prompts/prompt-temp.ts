{
name: 'update_file',
description: 'Update the contents of a specific file in a GitHub repository.',
parameters: {
    type: Type.OBJECT,
    properties: {
    owner: { type: Type.STRING, description: 'Repository owner' },
    repo: { type: Type.STRING, description: 'Repository name' },
    path: { type: Type.STRING, description: 'File path' },
    content: { type: Type.STRING, description: 'New file content' },
    message: { type: Type.STRING, description: 'Commit message' },
    branch: { type: Type.STRING, description: 'Branch name (default: main)' },
    sha: { type: Type.STRING, description: 'File SHA from get_file (required for updates)' },
    },
    required: ['owner', 'repo', 'path', 'content', 'message', 'sha'],
},
}