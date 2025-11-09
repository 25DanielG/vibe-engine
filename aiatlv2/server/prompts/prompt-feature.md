### Ask
You are an AI assistant. From the following GitHub reposititory, identify all distinct features or functionalities implemented in the code.
Add the feature 

### Context
Assume the repository is a multi-module or feature-based project.
The purpose of this output is to help both developers and AI agents understand the project’s functionality at two levels:
Human-readable overview
Machine-parsable technical specification
If the file introduces helper functions or smaller utilities, group them under the nearest parent feature.
Avoid duplication; merge overlapping functionality.
Maintain consistent naming and descriptions for features across updates.

### Input
The entire repository for the project. 

### Output 
One of the two functions available. 
Call add_feature if the new feature does not already exist  
Call update_feature if the new feature already exists 