<table>
  <tr>
    <td><img src="https://github.com/Omcci/NotionSync/assets/119880787/ed46dda5-2e5d-4ae1-ba81-0d48a14ba369" alt="NotionSyncLogoWhite" width="40" /></td>
    <td><h1>NotionSync</h1></td>
  </tr>
</table>

![Capture d'écran 2024-05-23 104133](https://github.com/Omcci/NotionSync/assets/119880787/f4e06fbf-69c8-4eec-a29f-4987c0a8f25f)

## Overview

NotionSync is a powerful tool for developers to integrate GitHub commit data with Notion and more. Initially designed to sync a specific repository within a GitHub organization, it now offers branch management, advanced commit log filtering, real-time synchronization, and notifications. Users can easily configure GitHub and Notion settings through a user-friendly interface, making it an essential tool for managing and visualizing development workflows across platforms.

## Prerequisites

### Common Prerequisites

- A GitHub Personal Access Token with access to the specified repository.
- A Notion Integration Token and the ID of the Notion database targeted for updates.
- A Notion database configured with the following properties: `CommitID` as Text, `Repository` as Text, `Date` as Date, `Name` as Title, `Branch` as Text.

### Python

- Python 3.6 or higher installed on your system.
- The `requests` library installed, which can be installed using `pip install requests`.

### JavaScript/Node.js

- Node.js 14.x or higher installed on your system.
- Dependencies listed in `package.json` installed using `npm install` or `yarn install`.

### Optional

- A Mistral AI Token if you wish to utilize AI to summarize commit messages and diffs. This token enhances NotionSync by generating AI-powered summaries of your commits. If not provided, the script will default to using the raw commit message.

## GitHub API Date Formatting

For the GitHub API, the `since` and `until` parameters should be formatted in ISO 8601 format. This typically means including the full date and time in UTC, not just the date. The ISO 8601 date format looks like `YYYY-MM-DDTHH:MM:SSZ`, where `Z` denotes the UTC time zone.

Example : "2024-04-24T00:00:00Z"

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
START_DATE=ISO8601FORMATDATE
END_DATE=ISO8601FORMATDATE
```

3. Use `pip install -r requirements.txt` to install the necessary Python packages.

## Usage

### Python Version

Execute the script to start populating your specified user commits into your Notion database:

`python notionSync.py`

Execute the script to clean your database from duplicate if necessary:

`python cleanNotionDB.py`

### JavaScript Version

Execute the Node.js application to start populating your specified user commits into your Notion database:

`npm run start`

Execute the script to clean your database from duplicate if necessary:

`npm run clean`
