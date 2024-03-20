# NotionSync

## Overview
NotionSync is a Python script specifically designed for developers who wish to automatically synchronize their GitHub commit data with a Notion database. 
Currently, the script focuses on iterating through a specific repository within a specified organization on GitHub. 
It populates a Notion database with details of the user's commits.

## Prerequisites
To utilize NotionSync, ensure you have the following prerequisites:
- Python 3.6 or higher installed on your system.
- The `requests` library installed. Install it using `pip install requests`.
- A GitHub Personal Access Token with access to the specified repository.
- A Notion Integration Token and the ID of the Notion database targeted for updates.

## Configuration
1. Clone this repository to your local machine.
2. Create a `.env` file in the project's root directory, including the following variables:

```
GITHUB_TOKEN=your_github_token_here
NOTION_TOKEN=your_notion_integration_token_here
NOTION_DATABASE_ID=your_notion_database_id_here
ORG_NAME=your_github_organization_name_here
REPO_NAME=your_targeted_repository_name_here
```

3. Use `pip install -r requirements.txt` to install the necessary Python packages.

## Usage
Execute the script to start populating your specified user commits into your Notion database:

``
python notionSync.py
``
