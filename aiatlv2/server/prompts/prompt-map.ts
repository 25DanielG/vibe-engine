import { Type } from '@google/genai';

export default [
  {
    name: 'add_feature_node',
    description: 'Create a new feature node connecting to other features in the undirected graph of core system functionalities.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'Unique feature name (e.g., "Authentication", "Database")',
          minLength: 1,
          maxLength: 100,
        },
        connected_features: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: 'Names of features this node is connected to in the feature graph',
          },
          description: 'Optional list of feature names this node connects to.',
          minItems: 0,
          uniqueItems: true,
          default: [],
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
];
