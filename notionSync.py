import requests
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

github_token = os.getenv('GITHUB_TOKEN')
notion_token = os.getenv('NOTION_TOKEN')
database_id = os.getenv('NOTION_DATABASE_ID')
org_name = os.getenv('ORG_NAME')
repo_name = os.getenv('REPO_NAME') 
# username = os.getenv('USERNAME') 
# start_date_str = os.getenv('START_DATE')
# end_date_str = os.getenv('END_DATE')
# start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
# end_date = datetime.strptime(end_date_str, "%Y-%m-%d")

# TODO: Add a Commit ID Field to Notion Database, Modify the Script to Use Another Unique Identifier

def fetch_org_repos(org_name, github_token):
    github_api_url = f"https://api.github.com/orgs/{org_name}/repos"
    headers = {"Authorization": f"token {github_token}"}
    response = requests.get(github_api_url, headers=headers)
    repos = response.json()
    return [repo['name'] for repo in repos if repo['name']]

def fetch_commits_for_user_in_repo(github_token, org_name, repo_name):
    github_api_url = f"https://api.github.com/repos/{org_name}/{repo_name}/commits?author=Omcci"
    headers = {"Authorization": f"token {github_token}"}
    response = requests.get(github_api_url, headers=headers)
    if response.status_code != 200:
        print(f"Erreur lors de la récupération des commits pour {repo_name}: {response.status_code}")
        print(f"Détails de l'erreur : {response.text}")
    else:
        commits = response.json()
        if commits:
            return commits
        else:
            print(f"Aucun commit trouvé pour {repo}.")
            return []

def delete_duplicate_commits(notion_token, block_id):
    headers = {
        "Authorization": f"Bearer {notion_token}",
        "Notion-Version": "2022-06-28",
    }
    delete_url = f"https://api.notion.com/v1/blocks/{block_id}"  # URL corrigée
    response = requests.delete(delete_url, headers=headers)
    if response.status_code == 200:
        print(f"Deleted duplicate commit block successfully: {block_id}")
    else:
        print(f"Failed to delete duplicate commit block: {block_id}, Status Code: {response.status_code}, Response: {response.text}")

def update_notion(notion_token, database_id, commits, repo_name):
    notion_query_url = f"https://api.notion.com/v1/databases/{database_id}/query"
    notion_api_url = "https://api.notion.com/v1/pages"
    headers = {
        "Authorization": f"Bearer {notion_token}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    for commit in commits:
        commit_message_first_line = commit.get("commit", {}).get("message", "No commit message").split('\n')[0]
        commit_date = commit.get("commit", {}).get("author", {}).get("date", "")
        query_data = {
            "filter": {
                "and": [
                    {
                        "property": "Name",
                        "title": {
                            "equals": commit_message_first_line
                        }
                    },
                    {
                        "property": "Repository",
                        "rich_text": {
                            "equals": repo_name
                        }
                    }
                ]
            }
        }
        response = requests.post(notion_query_url, headers=headers, json=query_data)

        if response.status_code == 200 and response.json().get("results"):
            page_ids = [page['id'] for page in response.json()["results"]]
            print(f"Commit already exists in Notion, skipping and attempting to delete duplicates: {commit_message_first_line}")
            for page_id in page_ids:
                print(f"Attempting to delete page with ID: {page_id}")
                # delete_duplicate_commits(notion_token, page_id)
            continue
        data = {
            "parent": {"database_id": database_id},
            "properties": {
                "Name": {
                    "title": [{"text": {"content": commit_message_first_line}}]
                },
                "Date": {
                    "date": {"start": commit.get("commit", {}).get("author", {}).get("date", "")}
                },
                "Repository": {
                    "rich_text": [{"text": {"content": repo_name}}]
                }
            }
        }
        response = requests.post(notion_api_url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"Commit added to Notion successfully: {commit_message_first_line}")
        else:
            print(f"Error adding commit to Notion: {response.status_code}, Response: {response.text}")

def main(github_token, org_name, repo_name):
    commits = fetch_commits_for_user_in_repo(github_token, org_name, repo_name)
    if commits:
        print(f"Commits trouvés dans le dépôt {repo_name}:")
        for commit in commits:
            print(f"- {commit['commit']['author']['date']}: {commit['commit']['message']}")
        update_notion(notion_token, database_id, commits, repo_name)
    else:
        print(f"Aucun commit trouvé dans le dépôt {repo_name}.")

if __name__ == "__main__":
    main(github_token, org_name, repo_name)