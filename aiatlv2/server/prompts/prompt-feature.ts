import { Type } from '@google/genai';

export default [
  {
    name: 'add_feature',
    description: 'Add a new feature to the feature map',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Feature name' },
        user_description: { type: Type.STRING, description: 'Non-technical description' },
        technical_description: { type: Type.STRING, description: 'Technical description' },
        file_references: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of file paths',
        },
      },
      required: ['name', 'user_description', 'technical_description', 'file_references'],
    },
  },
  {
    name: 'update_feature',
    description: 'Update an existing feature in the feature map',
    parameters: {
      type: Type.OBJECT,
      properties: {
        feature_id: { type: Type.STRING, description: 'ID of feature to update' },
        name: { type: Type.STRING, description: 'Feature name' },
        user_description: { type: Type.STRING, description: 'Non-technical description' },
        technical_description: { type: Type.STRING, description: 'Technical description' },
        file_references: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of file paths',
        },
      },
      required: ['feature_id'],
    },
  },
];