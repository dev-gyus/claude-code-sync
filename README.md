# claude-code-sync

Backup and sync your Claude Code settings to the cloud via Git.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- **Git-based backup & restore** -- `~/.claude/` 설정을 Git 저장소에 버전 관리합니다. 한 기기에서 push하고 다른 기기에서 pull하세요.
- **모듈별 동기화** -- core, skills, commands, memory, plugins, plans 중 원하는 것만 선택하여 동기화할 수 있습니다.
- **민감 데이터 스캔** -- push 전에 API 키, 토큰, 시크릿을 자동 스캔합니다. 감지되면 마스킹된 미리보기와 함께 경고합니다.
- **AES-256-GCM 암호화 (선택)** -- `CC_SYNC_KEY` 환경변수에 키를 설정하면 동기화 파일을 암호화합니다.
- **Dry-run 모드** -- 실제 변경 없이 push/pull 결과를 미리 확인할 수 있습니다.
- **충돌 해결** -- pull 시 로컬과 리모트가 다른 파일에 대해 파일별 덮어쓰기/유지를 선택할 수 있습니다.

## Quick Start

### 사전 요구사항

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 설치
- Git
- Node.js 18+

### Claude Code 플러그인으로 설치

```bash
claude plugin add /path/to/claude-code-sync
```

### 초기화

private 저장소를 먼저 만든 후 연결합니다:

```
/sync-init git@github.com:you/claude-settings.git
```

### 설정 push

```
/sync-push
```

### 다른 기기에서 pull

```
/sync-pull
```

## Commands

| Command | Description |
|---------|-------------|
| `/sync-init <remote-url>` | Git 저장소에 연결하여 동기화 초기화 |
| `/sync-push [options]` | 로컬 설정을 리모트에 push |
| `/sync-pull [options]` | 리모트 설정을 로컬로 pull |
| `/sync-status` | 동기화 상태 및 모듈별 변경사항 확인 |
| `/sync-help` | 도움말 및 사용 예시 표시 |

### `/sync-init <remote-url>`

```
/sync-init git@github.com:you/claude-settings.git
/sync-init --module core,skills,commands,memory https://github.com/you/claude-settings.git
```

`~/.claude/.cc-sync-repo/`에 sync 저장소를 클론(또는 초기화)하고 설정 파일을 생성합니다.

### `/sync-push [options]`

| Option | Description |
|--------|-------------|
| `--module <names>` | push할 모듈 지정 (쉼표 구분, 기본: 활성화된 모든 모듈) |
| `--message <msg>` | 커스텀 커밋 메시지 |
| `--dry-run` | 실제 push 없이 변경사항 미리보기 |
| `--force` | 강제 push |

### `/sync-pull [options]`

| Option | Description |
|--------|-------------|
| `--module <names>` | pull할 모듈 지정 (쉼표 구분) |
| `--dry-run` | 실제 적용 없이 변경사항 미리보기 |
| `--backup` | pull 전에 현재 설정의 타임스탬프 백업 생성 |
| `--keep-local` | 충돌 발생 시 모든 로컬 파일 유지 |

#### 충돌 해결

pull 시 로컬과 리모트 파일이 다를 경우 파일별로 처리 방법을 질문합니다:

| 상태 | 설명 | 처리 |
|------|------|------|
| `new` | 리모트에만 존재 | 자동 복사 |
| `identical` | 양쪽 동일 | 스킵 |
| `conflict` | 양쪽 다름 | 유저에게 질문 (덮어쓰기 / 로컬 유지) |
| `local-only` | 로컬에만 존재 | 건드리지 않음 |

### `/sync-status`

리모트 URL, 브랜치, 기기 ID, 마지막 동기화 시간, 모듈별 변경 파일 수를 표시합니다.

## Configuration

`~/.claude/.cc-sync.yml`에 설정이 저장됩니다. `/sync-init`으로 자동 생성되며, 직접 편집할 수도 있습니다.

```yaml
# Git 리모트 URL
remote: "git@github.com:you/claude-settings.git"

# 동기화 브랜치
branch: "main"

# 동기화할 모듈
modules:
  core: true        # CLAUDE.md, 프레임워크 문서, settings.json
  skills: true      # ~/.claude/skills/
  commands: true    # ~/.claude/commands/
  memory: false     # 프로젝트 메모리 파일
  plugins: false    # 플러그인 설치 매니페스트
  plans: false      # 플랜 파일
  full: false       # 전체 백업 (제외 패턴 적용)

# 민감 데이터 처리
sensitive:
  encrypt: false    # AES-256-GCM 암호화 (CC_SYNC_KEY 필요)
  exclude:          # 동기화에서 제외할 패턴
    - "*.jsonl"
    - "debug/"
    - "telemetry/"
    - "shell-snapshots/"
    - "file-history/"
    - "*.lock"
    - "*.highwatermark"
    - "paste-cache/"
    - "sessions/"
    - "statsig/"
    - "chrome/"
    - "ide/"
    - "cache/"
    - "todos/"
    - "backups/"

# 커밋 메시지에 포함할 기기 식별자
machine_id: ""
```

## Modules

| Module | What it syncs | Default |
|--------|---------------|---------|
| `core` | `CLAUDE.md`, 프레임워크 문서 (`COMMANDS.md`, `FLAGS.md` 등), `settings.json` | Enabled |
| `skills` | `~/.claude/skills/` 디렉토리 (재귀) | Enabled |
| `commands` | `~/.claude/commands/` 디렉토리 (재귀) | Enabled |
| `memory` | `~/.claude/projects/*/memory/` 프로젝트별 메모리 파일 | Disabled |
| `plugins` | 플러그인 설치 매니페스트 (`installed_plugins.json`) | Disabled |
| `plans` | `~/.claude/plans/` 플랜 마크다운 파일 | Disabled |
| `full` | `~/.claude/` 전체 (제외 패턴 적용: sessions, cache, telemetry 등) | Disabled |

### 모듈 설정 방법

**1. 초기화 시 지정:**
```
/sync-init git@github.com:you/repo.git --module core,skills,commands,memory
```

**2. push/pull 시 임시 오버라이드:**
```
/sync-push --module core,skills
/sync-pull --module core,skills,memory
```

**3. 설정 파일 직접 편집:**

`~/.claude/.cc-sync.yml`의 `modules` 섹션을 수정합니다.

## Security

### 민감 데이터 스캔

`/sync-push` 실행 시 커밋 전에 파일을 스캔합니다:

- API 키, 토큰, 비밀번호, 시크릿
- PEM 형식 개인 키
- 주요 서비스 키 (OpenAI `sk-*`, GitHub `ghp_*`, AWS 액세스 키 등)

감지되면 마스킹된 미리보기와 함께 경고합니다. 파일은 여전히 push됩니다 -- 직접 확인할 수 있는 기회를 제공합니다.

### 권장사항

- **Private 저장소를 사용하세요.** Claude Code 설정에는 개인 지침, 프로젝트 컨텍스트, API 참조 등이 포함될 수 있습니다.
- **암호화를 활성화하세요.** `.cc-sync.yml`에서 `sensitive.encrypt: true`로 설정하고 `CC_SYNC_KEY`를 export하세요:

```bash
# 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 쉘 프로필에 설정
export CC_SYNC_KEY="your-64-char-hex-key"
```

### 기본 제외 패턴

`full` 모듈은 불필요한/임시 경로를 자동 제외합니다: `sessions/`, `cache/`, `telemetry/`, `debug/`, `todos/`, `backups/`, `*.jsonl`, `*.lock`, `.cc-sync-repo/` 등.

## Examples

```bash
# 특정 모듈만 push (커스텀 메시지)
/sync-push --module core,skills --message "프레임워크 업데이트"

# dry-run으로 변경사항 미리보기
/sync-push --dry-run

# 백업 후 core 모듈만 pull
/sync-pull --backup --module core

# 충돌 시 로컬 파일 모두 유지
/sync-pull --keep-local
```

## Development

```bash
# 클론
git clone https://github.com/dev-gyus/claude-code-sync.git
cd claude-code-sync

# 의존성 설치
npm install

# 빌드
npm run build

# 테스트
npm test

# Watch 모드
npm run test:watch
```

### Project Structure

```
claude-code-sync/
├── .claude-plugin/
│   ├── plugin.json        # 플러그인 메타데이터
│   └── marketplace.json   # 마켓플레이스 설정
├── commands/              # 슬래시 커맨드 정의 (markdown)
│   ├── sync-init.md
│   ├── sync-push.md
│   ├── sync-pull.md
│   ├── sync-status.md
│   └── sync-help.md
├── scripts/               # 커맨드 실행 쉘 스크립트
├── src/
│   ├── cli.ts             # CLI 엔트리 포인트 (Commander.js)
│   ├── config.ts          # .cc-sync.yml 로더/저장
│   ├── sync-engine.ts     # 핵심 동기화 로직 (init, push, pull, status)
│   ├── modules/           # 동기화 모듈 구현
│   │   ├── base-module.ts # SyncModule 인터페이스 및 파일 복사 헬퍼
│   │   ├── core-settings.ts
│   │   ├── skills.ts
│   │   ├── commands.ts
│   │   ├── memory.ts
│   │   ├── plugins.ts
│   │   ├── plans.ts
│   │   ├── full-backup.ts
│   │   └── index.ts       # 모듈 레지스트리
│   └── utils/
│       ├── git.ts              # Git 명령 래퍼
│       ├── sensitive-scanner.ts # 시크릿 감지
│       ├── crypto.ts           # AES-256-GCM 암호화/복호화
│       ├── file-mapper.ts      # 파일 매핑 유틸리티
│       └── logger.ts           # 콘솔 출력 헬퍼
├── tests/
│   ├── unit/              # 단위 테스트
│   ├── integration/       # 통합 테스트
│   └── fixtures/          # 테스트 픽스처
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Roadmap

- [ ] Git hook 또는 파일 워처를 통한 자동 동기화
- [ ] 양방향 충돌 해결 (three-way merge)
- [ ] Git 외 스토리지 어댑터 (S3, Google Drive)
- [ ] 모듈별 암호화 세분화
- [ ] diff 미리보기 Web UI

## License

[MIT](LICENSE)
