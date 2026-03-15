---
description: "Show Claude Code Sync help"
argument-hint: ""
allowed-tools: []
---

Display the following help documentation to the user exactly as written below. Do not summarize or shorten it.

# Claude Code Sync - Help

Backup and sync your Claude Code settings to a Git repository.

## Commands

| Command | Description |
|---------|-------------|
| `/sync-init <url>` | Connect to a Git repo for settings backup |
| `/sync-push` | Push local settings to remote |
| `/sync-pull` | Pull settings from remote to local |
| `/sync-status` | Show current sync status |

## Quick Start

1. Create a private GitHub repository for your settings
2. Run `/sync-init git@github.com:you/claude-settings.git`
3. Use `/sync-push` to backup and `/sync-pull` to restore

## Modules

| Module | Description | Default |
|--------|-------------|---------|
| core | CLAUDE.md, framework docs, settings.json | Enabled |
| skills | Custom skills (~/.claude/skills/) | Enabled |
| commands | Custom commands (~/.claude/commands/) | Enabled |
| memory | Project memory files | Disabled |
| plugins | Plugin install manifest | Disabled |
| plans | Execution plans | Disabled |
| full | Full backup (with exclusions) | Disabled |

## Module Configuration

Modules can be enabled/disabled in three ways:

### 1. At init time
```
/sync-init git@github.com:you/repo.git --module core,skills,commands,memory
```

### 2. Per push/pull (temporary override)
```
/sync-push --module core,skills,memory
/sync-pull --module core,skills,memory,plugins
```

### 3. Edit config file directly
Edit `~/.claude/.cc-sync.yml`:
```yaml
modules:
  core: true        # Enabled by default
  skills: true      # Enabled by default
  commands: true    # Enabled by default
  memory: false     # Change to true to enable
  plugins: false    # Change to true to enable
  plans: false      # Change to true to enable
  full: false       # Change to true to enable
```

## Pull Conflict Resolution

`/sync-pull` 실행 시 로컬 파일과 리모트 파일이 다를 경우, 파일별로 어떻게 처리할지 질문합니다.

| 옵션 | 설명 |
|------|------|
| `--keep-local` | 충돌 시 모든 로컬 파일 유지 (질문 없이 일괄 스킵) |
| `--backup` | pull 전에 현재 설정 백업 생성 |

### 충돌 상태 유형

| 상태 | 설명 | 처리 |
|------|------|------|
| new | 리모트에만 존재 | 자동 복사 |
| identical | 양쪽 동일 | 스킵 |
| conflict | 양쪽 다름 | 유저에게 질문 |
| local-only | 로컬에만 존재 | 건드리지 않음 |

## Examples

```
/sync-push --module core,skills --message "Updated framework"
/sync-pull --backup --module core
/sync-pull --keep-local
/sync-push --dry-run
```
