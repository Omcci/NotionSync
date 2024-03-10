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

def update_notion(notion_token, database_id, commits, repo_name):
    notion_api_url = "https://api.notion.com/v1/pages"
    headers = {
        "Authorization": f"Bearer {notion_token}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    for commit in commits:
        commit_message = commit.get("commit", {}).get("message", "No commit message")
        data = {
            "parent": {"database_id": database_id},
            "properties": {
                "Name": {"title": [{"text": {"content": commit_message.split('\n')[0]}}]},
                "Date": {"date": {"start": commit["commit"]["author"]["date"]}},
                "Repository": {"rich_text": [{"text": {"content": repo_name}}]}
            }
        }
        response = requests.post(notion_api_url, headers=headers, json=data)
        response.encoding = 'utf-8'
        if response.status_code != 200:
            print(f"Erreur de requête Notion : {response.status_code}, Réponse : {response.text}")
        else:
            print(f"Commit de '{repo_name}' transféré avec succès.")

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