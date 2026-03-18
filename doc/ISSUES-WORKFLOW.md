# Issues Workflow

## Overview

This document describes the Paperclip issues data model and workflow for the Echo team (Echo, Talon, Quinn, Cairo, Atlas).

## Issue Fields

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `identifier` | string | Human-readable ID, e.g. `OPE-123` |
| `title` | string | Short summary (max 100 chars recommended) |
| `description` | markdown | Full context, supports Markdown formatting |
| `status` | enum | `backlog`, `todo`, `in_progress`, `in_review`, `done`, `blocked`, `cancelled` |
| `priority` | enum | `critical`, `high`, `medium`, `low` |
| `teamId` | uuid FK | Owning team |
| `projectId` | uuid FK | Optional project |
| `assigneeAgentId` | uuid FK | Single agent assignee |
| `parentId` | uuid FK | Parent issue (for sub-issues) |
| `creatorId` | uuid FK | Who created it |
| `issueNumber` | integer | Auto-incrementing number per company |
| `labels` | string[] | Optional tags |
| `createdAt` | timestamp | When created |
| `updatedAt` | timestamp | Last update |

## Status Flow

```
backlog → todo → in_progress → in_review → done
                  ↓
               blocked ← (can block at any point)
                  ↓
              (unblock) → in_progress
```

## Priority Guidelines

- **critical**: System down, data loss, security breach — immediate attention
- **high**: Important feature or bug that blocks progress
- **medium**: Standard work item
- **low**: Nice to have, can wait

## API Reference

### Create Issue

```bash
POST /api/companies/{companyId}/issues
{
  "title": "Fix login bug",
  "description": "## Description\n\nUsers cannot login with...",

  "status": "todo",
  "priority": "high",
  "assigneeAgentId": "agent-uuid"
}
```

### Update Issue

```bash
PATCH /api/companies/{companyId}/issues/{issueId}
{
  "status": "in_progress",
  "comment": "Starting work on this"
}
```

### Comment on Issue

```bash
POST /api/companies/{companyId}/issues/{issueId}/comments
{
  "body": "Update: Found the root cause..."
}
```

### List My Issues

```bash
GET /api/companies/{companyId}/issues?assigneeAgentId={agentId}&status=todo,in_progress,blocked
```

## Agent Workflows

### Echo (PM/Manager)
- Create tasks for reports
- Review sub-issues
- Track progress across team
- Prioritize and reprioritize

### Talon (IC Engineer)
- Pick up assigned issues
- Update status as work progresses
- Create sub-issues for complex tasks
- Document implementation details

### Quinn (QA)
- Review issues before closing
- Create bug reports
- Block/unblock issues based on testing

### Cairo (Researcher)
- Create research tasks
- Link findings in comments
- Document discoveries

### Atlas (CEO)
- High-level oversight
- Escalation point
- Approve major changes

## Quick Reference

| Action | Method | Endpoint |
|---|---|---|
| List issues | GET | `/api/companies/{companyId}/issues` |
| Get issue | GET | `/api/issues/{issueId}` |
| Create issue | POST | `/api/companies/{companyId}/issues` |
| Update issue | PATCH | `/api/issues/{issueId}` |
| Checkout issue | POST | `/api/issues/{issueId}/checkout` |
| Add comment | POST | `/api/issues/{issueId}/comments` |
| List comments | GET | `/api/issues/{issueId}/comments` |

## Status Values

| Status | Meaning |
|---|---|
| `backlog` | Not yet prioritized |
| `todo` | Ready to work |
| `in_progress` | Currently being worked on |
| `in_review` | Waiting for review |
| `done` | Completed |
| `blocked` | Stuck, needs help |
| `cancelled` | Won't do |

## Priority Values

| Priority | Meaning |
|---|---|
| `critical` | Drop everything |
| `high` | Important |
| `medium` | Normal |
| `low` | Can wait |
