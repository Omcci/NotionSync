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
- A Notion database with the following properties : `CommitID as Text`, `Repository as Text`, `Date as Date`, `Name as Title`, `Branch as Text`.
Optional:
- A `Mistral AI Token` if you wish to utilize AI to summarize commit messages and diffs. This token is not required for the basic functionality of NotionSync. However, if you're interested in leveraging AI to generate summaries of your commits, you will need to obtain a Mistral token. Without this token, NotionSync will simply use the original commit message for the `Commit Content`.


## Configuration
1. Clone this repository to your local machine.
2. Create a `.env` file in the project's root directory, including the following variables (you can use the .env sample for help):

```
GITHUB_TOKEN=your_github_token_here
NOTION_TOKEN=your_notion_integration_token_here
NOTION_DATABASE_ID=your_notion_database_id_here
ORG_NAME=your_github_organization_name_here
REPO_NAME=your_targeted_repository_name_here
MISTRAL_TOKEN= your_mistral_token
```

3. Use `pip install -r requirements.txt` to install the necessary Python packages.

## Usage
Execute the script to start populating your specified user commits into your Notion database:

``
python notionSync.py
``

Execute the script to clean your database from duplicate if necessary:

``
python cleanNotionDB.py
``

