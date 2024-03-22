import requests
from dotenv import load_dotenv
import os

load_dotenv()

notion_token = os.getenv('NOTION_TOKEN')
database_id = os.getenv('NOTION_DATABASE_ID')

def fetch_all_commits_from_notion(notion_token, database_id):
    notion_query_url = f"https://api.notion.com/v1/databases/{database_id}/query"
    headers = {
        "Authorization": f"Bearer {notion_token}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    has_more = True
    start_cursor = None
    commits = []

    while has_more:
        payload = {}
        if start_cursor:
            payload["start_cursor"] = start_cursor
        
        response = requests.post(notion_query_url, headers=headers, json=payload)
        data = response.json()
        commits.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        start_cursor = data.get("next_cursor")
    return commits

def delete_duplicate_commits(notion_token, duplicate_commit_ids):
    for block_id in duplicate_commit_ids:
        delete_url = f"https://api.notion.com/v1/blocks/{block_id}"
        headers = {"Authorization": f"Bearer {notion_token}", "Notion-Version": "2022-06-28"}
        response = requests.delete(delete_url, headers=headers)
        if response.status_code == 200:
            print(f"Deleted duplicate commit block successfully: {block_id}")
        else:
            print(f"Failed to delete duplicate commit block: {block_id}, Status Code: {response.status_code}, Response: {response.text}")


# def delete_duplicate_commits(notion_token, block_id):
#     headers = {
#         "Authorization": f"Bearer {notion_token}",
#         "Notion-Version": "2022-06-28",
#     }
#     delete_url = f"https://api.notion.com/v1/blocks/{block_id}"  # URL corrigée
#     response = requests.delete(delete_url, headers=headers)
#     if response.status_code == 200:
#         print(f"Deleted duplicate commit block successfully: {block_id}")
#     else:
#         print(f"Failed to delete duplicate commit block: {block_id}, Status Code: {response.status_code}, Response: {response.text}")

def main(notion_token, database_id):
    all_commits = fetch_all_commits_from_notion(notion_token, database_id)
    print(all_commits)

    commit_id_counts = {}
    for commit in all_commits:
        commit_id = None
        for prop in commit.get("properties", {}).get("Commit ID", {}).get("rich_text", []):
            commit_id = prop.get("text", {}).get("content")
            if commit_id:
                if commit_id in commit_id_counts:
                    commit_id_counts[commit_id].append(commit["id"])
                else:
                    commit_id_counts[commit_id] = [commit["id"]]
    
    for commit_id, ids in commit_id_counts.items():
        if len(ids) > 1:
            print(f"Deleting duplicates for Commit ID: {commit_id}")
            delete_duplicate_commits(notion_token, ids[1:])


if __name__ == "__main__":
    main(notion_token, database_id)
