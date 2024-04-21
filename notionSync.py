import requests
from dotenv import load_dotenv
import os
from datetime import datetime
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from prompts import mistral_prompt

load_dotenv()

# TODO: convert this file into a node file

github_token = os.getenv('GITHUB_TOKEN')
notion_token = os.getenv('NOTION_TOKEN')
database_id = os.getenv('NOTION_DATABASE_ID')
org_name = os.getenv('ORG_NAME')
repo_name = os.getenv('REPO_NAME') 
mistral_token = os.getenv('MISTRAL_TOKEN')
# username = os.getenv('USERNAME') 
# start_date_str = os.getenv('START_DATE')
# end_date_str = os.getenv('END_DATE')
# start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
# end_date = datetime.strptime(end_date_str, "%Y-%m-%d")

def summarize_commit_with_mistral(commit_message, diff, mistral_token):
    filtered_diff_lines = []
    skip_current_file = False
    for line in diff.split("\n"):
        if line.startswith("diff --git") and ".svg" in line:
            skip_current_file = True
        elif line.startswith("diff --git"):
            skip_current_file = False
        if not skip_current_file:
            filtered_diff_lines.append(line)

    filtered_diff = "\n".join(filtered_diff_lines)
    
    model = "open-mistral-7b"
    client = MistralClient(api_key=mistral_token)
    prompt = mistral_prompt.format(commit_message=commit_message, diff=filtered_diff)
    messages = [ChatMessage(role="user", content=prompt)]
    chat_response = client.chat(model=model, messages=messages)
    summary = chat_response.choices[0].message.content if chat_response.choices else "Summary not available"
    token_count = len(summary.split())
    summary_with_token_count = f"{summary}\n\nToken count: {token_count}"
    return summary_with_token_count

def fetch_repo_branches(github_token, org_name, repo_name):
    github_api_url = f"https://api.github.com/repos/{org_name}/{repo_name}/branches"
    headers = {"Authorization": f"token {github_token}"}
    response = requests.get(github_api_url, headers=headers)
    if response.status_code == 200:
        branches = response.json()
        return [branch['name'] for branch in branches]
    else:
        print(f"Erreur lors de la récupération des branches pour {repo_name}: {response.status_code}")
        return []

def fetch_commits_for_user_in_repo(github_token, org_name, repo_name, branch_name):
    all_commits = []
    github_api_url = f"https://api.github.com/repos/{org_name}/{repo_name}/commits?sha={branch_name}&author=Omcci"
    headers = {"Authorization": f"token {github_token}"}
    response = requests.get(github_api_url, headers=headers)
    if response.status_code == 200:
        commits = response.json()
        all_commits.extend(commits)
    else:
        print(f"Error retrieving commits for {repo_name} on branch {branch_name}: {response.status_code}")
    return all_commits

# def fetch_commit_details(github_token, org_name, repo_name, commit_sha):
#     url = f"https://api.github.com/repos/{org_name}/{repo_name}/commits/{commit_sha}"
#     headers = {"Authorization": f"token {github_token}"}
#     response = requests.get(url, headers=headers)
#     commit_details = response.json()
#     return commit_details

def fetch_commit_diff(github_token, org_name, repo_name, commit_sha):
    diff_url = f"https://api.github.com/repos/{org_name}/{repo_name}/commits/{commit_sha}"
    headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3.diff"  # Request diff format
    }    
    response = requests.get(diff_url, headers=headers)
    if response.status_code == 200:
        return response.text  # Return the diff as a string
    else:
        print(response.json().get('message'))
        print(f"Error retrieving commit diff for {repo_name} on commit {commit_sha}: {response.status_code}")
        return None
    
def commit_exists_in_notion(commit_sha, notion_token, database_id):
    notion_query_url = f"https://api.notion.com/v1/databases/{database_id}/query"
    headers = {"Authorization": f"Bearer {notion_token}", "Content-Type": "application/json", "Notion-Version": "2022-06-28"}
    query_data = {"filter": {"property": "Commit ID", "text": {"equals": commit_sha}}}
    response = requests.post(notion_query_url, headers=headers, json=query_data)
    results = response.json().get("results", [])
    return len(results) > 0, results

def add_commit_to_notion(commit, commit_message, notion_token, database_id, repo_name, branch_name, mistral_token):
    commit_message = commit["commit"]["message"]
    commit_diff = fetch_commit_diff(github_token, org_name, repo_name, commit["sha"])
    if not commit_diff:
            print(f"Could not fetch diff for commit {commit['sha']}. Skipping.")
            return

    if mistral_token:
        summary_with_token_count = summarize_commit_with_mistral(commit_message, commit_diff, mistral_token)
    else:
        summary_with_token_count = commit_message

    notion_api_url = "https://api.notion.com/v1/pages"
    headers = {"Authorization": f"Bearer {notion_token}", "Content-Type": "application/json", "Notion-Version": "2022-06-28"}
    data = {
        "parent": {"database_id": database_id},
        "properties": {
            "Commit ID": {"rich_text": [{"text": {"content": commit["sha"]}}]},
            "Name": {"title": [{"text": {"content": summary_with_token_count}}]},
            "Date": {"date": {"start": commit["commit"]["author"]["date"]}},
            "Repository": {"rich_text": [{"text": {"content": repo_name}}]},
            "Branch": {"rich_text": [{"text": {"content": branch_name}}]}
        }
    }
    response = requests.post(notion_api_url, headers=headers, json=data)
    if response.status_code == 200:
        print(f"Commit added to Notion successfully: {commit['sha']}")
    else:
        print(f"Error adding commit to Notion: {response.status_code}, Response: {response.text}")


def main(github_token, org_name, repo_name, mistral_token):
    branch_names = fetch_repo_branches(github_token, org_name, repo_name)
    processed_commits = set() 

    for branch_name in branch_names:
        commits = fetch_commits_for_user_in_repo(github_token, org_name, repo_name, branch_name)

        for commit in commits:
            commit_sha = commit.get("sha")
            if commit_sha in processed_commits:
                print(f"Commit {commit_sha} déjà traité. Skipping.")
                continue

            exists, _ = commit_exists_in_notion(commit_sha, notion_token, database_id)
            if exists:
                print(f"Commit {commit_sha} existe déjà dans Notion. Skipping.")
            else:
                commit_message = commit['commit']['message']
                add_commit_to_notion(commit, commit_message, notion_token, database_id, repo_name, branch_name, mistral_token)

            processed_commits.add(commit_sha)


if __name__ == "__main__":
    main(github_token, org_name, repo_name, mistral_token)

# def update_notion(notion_token, database_id, commits, repo_name, branch_name):
#     notion_query_url = f"https://api.notion.com/v1/databases/{database_id}/query"
#     notion_api_url = "https://api.notion.com/v1/pages"
#     headers = {
#         "Authorization": f"Bearer {notion_token}",
#         "Content-Type": "application/json",
#         "Notion-Version": "2022-06-28"
#     }

#     processed_commits = set()  # Track processed commits to avoid re-processing

#     for commit in commits:
#         commit_sha = commit.get("sha")  
#         commit_message_first_line = commit.get("commit", {}).get("message", "No commit message").split('\n')[0]
#         commit_date = commit.get("commit", {}).get("author", {}).get("date", "")
#         branch_name = commit.get("branch_name", "N/A")
#         if commit_sha in processed_commits:
#             print(f"Commit {commit_sha} already processed, skipping.")
#             continue

#         query_data = {
#             "filter": {
#                 "property": "Commit ID",
#                 "text": {
#                     "equals": commit_sha
#                 }
#             }
#         }
#         response = requests.post(notion_query_url, headers=headers, json=query_data)
#         results = response.json().get("results", [])

#         if len(results) == 1:
#             print(f"Commit {commit_sha} already exists in Notion. Skipping.")
#             processed_commits.add(commit_sha)  # Mark this commit as processed
#             continue
#         elif len(results) > 1:  # Handle duplicates by deleting all but one
#             for result in results[1:]:  # Keep the first entry, delete the rest
#                 delete_duplicate_commits(notion_token, result["id"])
#             processed_commits.add(commit_sha)  # Mark this commit as processed
#             continue

#         if not results:
#             data = {
#             "parent": {"database_id": database_id},
#             "properties": {
#                 "Commit ID": {"rich_text": [{"text": {"content": commit_sha}}]},
#                 "Name": {"title": [{"text": {"content": commit_message_first_line}}]},
#                 "Date": {"date": {"start": commit_date}},
#                 "Repository": {"rich_text": [{"text": {"content": repo_name}}]},
#                 "Branch": {"rich_text": [{"text": {"content": branch_name}}]}
#                 }
#             }
#             response = requests.post(notion_api_url, headers=headers, json=data)
#             if response.status_code == 200:
#                 print(f"Commit added to Notion successfully: {commit_sha}")
#             else:
#                 print(f"Error adding commit to Notion: {response.status_code}, Response: {response.text}")
#             processed_commits.add(commit_sha)