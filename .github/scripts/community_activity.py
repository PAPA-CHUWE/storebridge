"""Email GitHub community activity and persist notification state on a data branch."""

from __future__ import annotations

import base64
import hashlib
import json
import os
import smtplib
import ssl
import sys
import time
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

API = "https://api.github.com"
STATE_BRANCH = "community-monitor-state"
STATE_PATH = "state.json"
API_VERSION = "2022-11-28"
STATE_DEFAULT = {"events": {}, "fork_heads": {}, "clone_stats": None}


class GitHubAPIError(RuntimeError):
    def __init__(self, status: int, body: str):
        super().__init__(f"GitHub API returned HTTP {status}: {body[:400]}")
        self.status = status


class GitHub:
    def __init__(self, token: str, repository: str):
        if not token:
            raise RuntimeError("GITHUB_TOKEN is unavailable")
        self.token = token
        self.repository = repository

    def request(self, method: str, path: str, payload: dict | None = None):
        body = json.dumps(payload).encode() if payload is not None else None
        request = Request(  # noqa: S310 - URL is built from the fixed api.github.com origin.
            f"{API}{path}",
            data=body,
            method=method,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {self.token}",
                "X-GitHub-Api-Version": API_VERSION,
                "Content-Type": "application/json",
                "User-Agent": "StoreBridge-Community-Monitor",
            },
        )
        try:
            with urlopen(request, timeout=30) as response:  # noqa: S310 - fixed HTTPS API origin.
                raw = response.read()
                return json.loads(raw) if raw else None
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            raise GitHubAPIError(exc.code, detail) from exc

    def repo_path(self, suffix: str) -> str:
        owner, name = self.repository.split("/", 1)
        return f"/repos/{quote(owner)}/{quote(name)}{suffix}"


class StateStore:
    """A small persistent JSON ledger stored on a dedicated, non-code branch."""

    def __init__(self, github: GitHub):
        self.github = github

    def _ensure_branch(self) -> None:
        ref_path = self.github.repo_path(f"/git/ref/heads/{quote(STATE_BRANCH, safe='')}")
        try:
            self.github.request("GET", ref_path)
            return
        except GitHubAPIError as exc:
            if exc.status != 404:
                raise

        repository = self.github.request("GET", self.github.repo_path(""))
        default_branch = repository["default_branch"]
        base_ref = self.github.repo_path(f"/git/ref/heads/{quote(default_branch, safe='')}")
        base = self.github.request("GET", base_ref)
        try:
            self.github.request(
                "POST",
                self.github.repo_path("/git/refs"),
                {"ref": f"refs/heads/{STATE_BRANCH}", "sha": base["object"]["sha"]},
            )
        except GitHubAPIError as exc:
            # Another event or monitor run may have created it after our GET.
            if exc.status not in (409, 422):
                raise

    def read(self) -> tuple[dict, str | None]:
        self._ensure_branch()
        path = self.github.repo_path(f"/contents/{STATE_PATH}?{urlencode({'ref': STATE_BRANCH})}")
        try:
            result = self.github.request("GET", path)
        except GitHubAPIError as exc:
            if exc.status != 404:
                raise
            return json.loads(json.dumps(STATE_DEFAULT)), None

        data = base64.b64decode(result["content"]).decode("utf-8")
        state = json.loads(data)
        for key, value in STATE_DEFAULT.items():
            state.setdefault(key, value)
        return state, result["sha"]

    def write(self, state: dict, sha: str | None, message: str) -> None:
        payload = {
            "message": message[:120],
            "branch": STATE_BRANCH,
            "content": base64.b64encode(
                (json.dumps(state, indent=2, sort_keys=True) + "\n").encode()
            ).decode(),
        }
        if sha:
            payload["sha"] = sha
        self.github.request("PUT", self.github.repo_path(f"/contents/{STATE_PATH}"), payload)

    def update(self, change, message: str) -> dict:
        """Read/merge/write with retries for concurrent workflow runs."""
        last_error = None
        for attempt in range(8):
            state, sha = self.read()
            change(state)
            try:
                self.write(state, sha, message)
                return state
            except GitHubAPIError as exc:
                if exc.status not in (409, 422):
                    raise
                last_error = exc
                time.sleep(min(0.5 * (attempt + 1), 4))
        raise RuntimeError("Could not update notification state after retries") from last_error


def now() -> datetime:
    return datetime.now(UTC)


def compact_time(value: str | None) -> str:
    if not value:
        return now().isoformat(timespec="seconds")
    return value.replace("Z", "+00:00")


def send_email(subject: str, body: str) -> None:
    required = (
        "COMMUNITY_NOTIFY_TO",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
        "SMTP_FROM",
    )
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise RuntimeError("Missing Actions secrets: " + ", ".join(missing))

    message = EmailMessage()
    message["Subject"] = subject[:180]
    message["From"] = os.environ["SMTP_FROM"]
    message["To"] = os.environ["COMMUNITY_NOTIFY_TO"]
    message.set_content(body)
    host = os.environ["SMTP_HOST"]
    port = int(os.environ["SMTP_PORT"])
    context = ssl.create_default_context()
    if port == 465:
        with smtplib.SMTP_SSL(host, port, context=context, timeout=30) as client:
            client.login(os.environ["SMTP_USERNAME"], os.environ["SMTP_PASSWORD"])
            client.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=30) as client:
            client.ehlo()
            client.starttls(context=context)
            client.ehlo()
            client.login(os.environ["SMTP_USERNAME"], os.environ["SMTP_PASSWORD"])
            client.send_message(message)


def run_id() -> str:
    return (
        f"{os.environ.get('GITHUB_RUN_ID', 'manual')}-{os.environ.get('GITHUB_RUN_ATTEMPT', '1')}"
    )


def claim(store: StateStore, fingerprint: str) -> bool:
    claimed = False
    run = run_id()
    cutoff = now() - timedelta(minutes=30)

    def change(state: dict) -> None:
        nonlocal claimed
        events = state.setdefault("events", {})
        current = events.get(fingerprint)
        if current and current.get("status") == "sent":
            return
        if current and current.get("status") == "pending":
            started = datetime.fromisoformat(current["at"])
            if started > cutoff and current.get("run_id") != run:
                return
        events[fingerprint] = {"status": "pending", "at": now().isoformat(), "run_id": run}
        prune_events(events)
        claimed = True

    store.update(change, "Reserve community notification")
    return claimed


def prune_events(events: dict) -> None:
    cutoff = now() - timedelta(days=180)
    for key, value in list(events.items()):
        try:
            if datetime.fromisoformat(value["at"]) < cutoff:
                events.pop(key, None)
        except (KeyError, TypeError, ValueError):
            events.pop(key, None)
    if len(events) > 5000:
        newest = sorted(events.items(), key=lambda item: item[1].get("at", ""))[-5000:]
        events.clear()
        events.update(newest)


def finish(store: StateStore, fingerprint: str) -> None:
    def change(state: dict) -> None:
        entry = state.setdefault("events", {}).get(fingerprint)
        if entry and entry.get("run_id") == run_id():
            entry["status"] = "sent"
            entry["at"] = now().isoformat()

    store.update(change, "Record community notification")


def release(store: StateStore, fingerprint: str) -> None:
    def change(state: dict) -> None:
        entry = state.setdefault("events", {}).get(fingerprint)
        if entry and entry.get("run_id") == run_id() and entry.get("status") == "pending":
            state["events"].pop(fingerprint, None)

    store.update(change, "Release failed community notification")


def deliver(store: StateStore, fingerprint: str, subject: str, body: str) -> bool:
    if not claim(store, fingerprint):
        print("Notification already sent or currently reserved; skipping.")
        return False
    try:
        send_email(subject, body)
    except Exception:
        release(store, fingerprint)
        raise
    finish(store, fingerprint)
    print("Community email sent.")
    return True


def event_identity(event_name: str, event: dict) -> tuple[str, str, str]:
    repo = event.get("repository", {})
    full_name = os.environ.get("GITHUB_REPOSITORY", "unknown/unknown")
    actor = (event.get("sender") or {}).get("login") or os.environ.get("GITHUB_ACTOR", "unknown")
    action = event.get("action", "")
    url = repo.get("html_url", f"https://github.com/{full_name}")
    stamp = now().isoformat(timespec="seconds")
    branch = ""
    commits: list[dict] = []
    details: list[str] = []

    if event_name == "push":
        branch = event.get("ref", "").removeprefix("refs/heads/")
        if branch == STATE_BRANCH:
            return "", "", ""
        after = event.get("after", "")
        commits = event.get("commits", [])
        if after and after != "0" * 40:
            latest = commits[-1] if commits else {}
            commit_url = latest.get("url") or f"{url}/commit/{after}"
            details.extend(
                [f"Branch: {branch or '(unknown)'}", f"New head: {after}", f"Commit: {commit_url}"]
            )
            if latest.get("message"):
                details.append("Latest commit: " + latest["message"].splitlines()[0])
        fingerprint = f"push:{full_name}:{branch}:{event.get('before', '')}:{after}"
        title = f"Push to {full_name}/{branch}"
        details.append(f"Commits in push: {len(commits)}")
        for commit in commits[-10:]:
            summary = commit.get("message", "").splitlines()[0]
            details.append(f"- {commit.get('id', '')[:12]} {summary} ({commit.get('url', '')})")
        stamp = (commits[-1].get("timestamp") if commits else None) or stamp
    elif event_name == "fork":
        fork = event.get("forkee", {})
        fork_name = fork.get("full_name", "unknown fork")
        url = fork.get("html_url", f"https://github.com/{fork_name}")
        fingerprint = f"fork:{fork.get('id', fork_name)}"
        title = f"New fork: {fork_name}"
        branch = fork.get("default_branch", "")
        details.extend([f"Fork: {url}", f"Default branch: {branch or '(unknown)'}"])
    elif event_name == "watch":
        sender_id = (event.get("sender") or {}).get("id", actor)
        star_count = repo.get("stargazers_count", "")
        fingerprint = f"star:{sender_id}:{star_count}"
        title = f"New star on {full_name}"
        details.append(f"Stars: {repo.get('stargazers_count', 'not provided by event')}")
    elif event_name == "pull_request_target":
        pr = event.get("pull_request", {})
        if action == "closed" and not pr.get("merged"):
            return "", "", ""
        number = pr.get("number", event.get("number", "?"))
        branch = (pr.get("head") or {}).get("ref", "")
        pr_url = pr.get("html_url", f"{url}/pull/{number}")
        merged = action == "closed" and bool(pr.get("merged"))
        event_label = "Merged pull request" if merged else "Pull request " + action
        fingerprint = (
            f"pr:{number}:{'merged' if merged else action}:{pr.get('updated_at', run_id())}"
        )
        title = f"{event_label}: #{number} {pr.get('title', '')}"[:180]
        details.extend(
            [
                f"Pull request: {pr_url}",
                f"Author: {(pr.get('user') or {}).get('login', 'unknown')}",
                f"Branch: {branch}",
            ]
        )
        if pr.get("merge_commit_sha"):
            sha = pr["merge_commit_sha"]
            details.append(f"Merge commit: {sha} ({url}/commit/{sha})")
        stamp = pr.get("merged_at") if merged else pr.get("updated_at", stamp)
    elif event_name == "issues":
        issue = event.get("issue", {})
        number = issue.get("number", event.get("number", "?"))
        fingerprint = f"issue:{number}:opened:{issue.get('created_at', run_id())}"
        title = f"New issue: #{number} {issue.get('title', '')}"[:180]
        details.extend(
            [
                f"Issue: {issue.get('html_url', url + '/issues/' + str(number))}",
                f"Author: {(issue.get('user') or {}).get('login', actor)}",
            ]
        )
        stamp = issue.get("created_at", stamp)
    else:
        return "", "", ""

    details.insert(0, f"Event: {event_name}" + (f" ({action})" if action else ""))
    details.insert(1, f"Actor: {actor}")
    details.insert(2, f"Repository: {full_name} ({url})")
    details.insert(3, f"Timestamp: {compact_time(stamp)}")
    server_url = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    workflow_run = os.environ.get("GITHUB_RUN_ID", "")
    details.append(f"Workflow run: {server_url}/{full_name}/actions/runs/{workflow_run}")
    return fingerprint, title, "\n".join(details)


def run_event(github: GitHub, store: StateStore) -> None:
    event_name = os.environ.get("GITHUB_EVENT_NAME", "")
    with open(os.environ["GITHUB_EVENT_PATH"], encoding="utf-8") as file:
        event = json.load(file)
    fingerprint, subject, body = event_identity(event_name, event)
    if not fingerprint:
        print("Event does not require a notification.")
        return
    deliver(store, fingerprint, subject, body)


def api_get(github: GitHub, path: str):
    return github.request("GET", path)


def run_monitor(github: GitHub, store: StateStore) -> None:
    traffic_token = os.environ.get("TRAFFIC_API_TOKEN", "")
    if not traffic_token:
        raise RuntimeError("Missing Actions secret: TRAFFIC_API_TOKEN")
    owner, name = github.repository.split("/", 1)
    traffic_url = f"{API}/repos/{quote(owner)}/{quote(name)}/traffic/clones"
    request = Request(  # noqa: S310 - URL is built from the fixed api.github.com origin.
        traffic_url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {traffic_token}",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "StoreBridge-Community-Monitor",
        },
    )
    try:
        with urlopen(request, timeout=30) as response:  # noqa: S310 - fixed HTTPS API origin.
            clone_stats = json.loads(response.read())
    except HTTPError as exc:
        raise RuntimeError(
            f"Traffic API returned HTTP {exc.code}; check TRAFFIC_API_TOKEN scope"
        ) from exc

    old_state, _ = store.read()
    old_stats = old_state.get("clone_stats")
    clone_increased = bool(
        old_stats is not None and clone_stats.get("count", 0) > old_stats.get("count", 0)
    )
    fork_changes = []
    current_forks: dict[str, dict] = {}
    scanned = 0

    for page in range(1, 6):
        path = github.repo_path(
            "/forks?" + urlencode({"sort": "newest", "per_page": 100, "page": page})
        )
        forks = api_get(github, path)
        if not forks:
            break
        for fork in forks:
            if fork.get("private") or not fork.get("full_name"):
                continue
            scanned += 1
            fork_name = fork["full_name"]
            branch = fork.get("default_branch") or "main"
            try:
                commit_path = (
                    f"/repos/{quote(fork_name, safe='/')}/commits/"
                    f"{quote(branch, safe='')}?per_page=1"
                )
                commit = api_get(github, commit_path)
            except GitHubAPIError as exc:
                if exc.status in (403, 404, 409):
                    continue
                raise
            sha = commit.get("sha") if isinstance(commit, dict) else None
            if not sha:
                continue
            commit_info = commit.get("commit", {})
            commit_url = commit.get("html_url", f"https://github.com/{fork_name}/commit/{sha}")
            value = {
                "sha": sha,
                "branch": branch,
                "url": commit_url,
                "message": (commit_info.get("message") or "").splitlines()[0],
                "author": (commit_info.get("author") or {}).get("name", "unknown"),
                "github_author": (commit.get("author") or {}).get("login", "unknown"),
                "timestamp": (commit_info.get("author") or {}).get("date", ""),
                "repository_url": fork.get("html_url", f"https://github.com/{fork_name}"),
            }
            current_forks[fork_name] = value
            previous = old_state.get("fork_heads", {}).get(fork_name)
            # First scan establishes a baseline; only subsequent head changes alert.
            if previous and previous.get("sha") != sha:
                fork_changes.append((fork_name, value))
        if len(forks) < 100 or scanned >= 500:
            break

    state_was_seeded = old_stats is None
    summary_parts = []
    if clone_increased:
        previous_count = old_stats.get("count", 0)
        current_count = clone_stats.get("count", 0)
        unique_count = clone_stats.get("uniques", "unknown")
        summary_parts.append(
            f"Aggregate clones increased from {previous_count} to {current_count} over "
            "GitHub's rolling 14-day window.\n"
            f"Current unique cloners in that window: {unique_count}."
        )
    if fork_changes:
        summary_parts.append(
            f"New default-branch heads detected on {len(fork_changes)} public fork(s):"
        )
        for fork_name, item in fork_changes[:50]:
            summary_parts.append(
                f"- {fork_name} ({item['repository_url']}) | branch {item['branch']} | "
                f"{item['sha']} | GitHub author {item['github_author']} "
                f"({item['author']}) | {item['message']} | {item['url']}"
            )

    if summary_parts:
        digest = hashlib.sha256("\n".join(summary_parts).encode()).hexdigest()[:24]
        fingerprint = f"monitor:{digest}"
        server_url = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
        workflow_run = os.environ.get("GITHUB_RUN_ID", "")
        body = "\n\n".join(
            [
                "Event: Scheduled community activity monitor",
                f"Repository: {github.repository} (https://github.com/{github.repository})",
                f"Timestamp: {now().isoformat(timespec='seconds')}",
                f"Public forks scanned: {scanned} (maximum 500, newest first)",
                *summary_parts,
                f"Workflow run: {server_url}/{github.repository}/actions/runs/{workflow_run}",
            ]
        )
        deliver(store, fingerprint, "StoreBridge community activity update", body)
    else:
        print("No aggregate clone increase or public fork default-branch update detected.")

    def update_snapshot(state: dict) -> None:
        state["clone_stats"] = {
            "count": clone_stats.get("count", 0),
            "uniques": clone_stats.get("uniques", 0),
            "checked_at": now().isoformat(),
        }
        heads = state.setdefault("fork_heads", {})
        heads.update(current_forks)
        if len(heads) > 1500:
            newest = sorted(heads.items(), key=lambda row: row[1].get("timestamp", ""))[-1500:]
            heads.clear()
            heads.update(newest)

    store.update(update_snapshot, "Update community monitor snapshot")
    if state_was_seeded:
        print("Initial traffic and public fork baseline recorded without a notification.")
    print(f"Monitor completed; checked {scanned} public fork(s).")


def main() -> None:
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    github = GitHub(os.environ.get("GITHUB_TOKEN", ""), repository)
    store = StateStore(github)
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "event":
        run_event(github, store)
    elif mode == "monitor":
        run_monitor(github, store)
    else:
        raise SystemExit("Usage: community_activity.py event|monitor")


if __name__ == "__main__":
    main()
