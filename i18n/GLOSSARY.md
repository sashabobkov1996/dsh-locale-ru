# Глоссарий для русификации DSH

Единая терминология. Если в глоссарии нет термина — переводить по смыслу, держась того же стиля.

## Основные термины

| English | Русский |
|---|---|
| session | сессия |
| agent | агент |
| subagent | субагент |
| workspace | рабочая область |
| working directory | рабочий каталог |
| tool | инструмент |
| plugin | плагин |
| skill | навык |
| model | модель |
| provider | провайдер |
| token | токен |
| context | контекст |
| prompt | запрос |
| message | сообщение |
| attachment | вложение |
| approval | подтверждение |
| permission | разрешение |
| sandbox | песочница |
| job (background job) | задача (фоновая задача) |
| schedule | расписание |
| workflow | рабочий процесс |
| goal | цель |
| plan | план |
| task | задача |
| trajectory | траектория |
| settings | настройки |
| account | аккаунт |
| usage | использование |
| quota | квота |
| reasoning | рассуждения |
| streaming | потоковая передача |
| commit | коммит |
| branch | ветка |
| diff | дифф |
| repository / repo | репозиторий |
| file | файл |
| folder | папка |
| search | поиск |
| sidebar | боковая панель |
| panel | панель |
| tab | вкладка |
| shortcut | сочетание клавиш |
| marketplace | магазин |
| inventory | список |
| diagnostics | диагностика |
| transcript | стенограмма |
| checkpoint | контрольная точка |
| retry | повторить |
| cancel | отмена |
| confirm | подтвердить |
| delete | удалить |
| copy | копировать |
| open | открыть |
| close | закрыть |
| save | сохранить |
| edit | изменить |
| rename | переименовать |
| enable / disable | включить / отключить |
| install / uninstall | установить / удалить |
| update | обновить |
| loading | загрузка |
| failed | не удалось |
| error | ошибка |
| warning | предупреждение |
| unknown | неизвестно |
| none | нет |

## Не переводить

DeepSeek, DSH, DeepSeek Harness, JSON, Markdown, CSS, HTML, API, CLI, SDK, ACP, MCP, URL, URI, ID, UUID, PDF, Excel, Word, PowerPoint, Office, CSV, YAML, TOML, HTTP, HTTPS, SSE, WebSocket, Git, GitHub, GitLab, Bash, PowerShell, TypeScript, JavaScript, React, Node.js, pnpm, npm, Cordis, Vim, Emacs, macOS, Windows, Linux, Ubuntu, Docker, WSL, UTF-8, base64, SHA-256, GPT, Claude, Anthropic, OpenAI, DeepSeek-V3, OAuth, SSH, PTY, KVM.

Названия клавиш: `Enter`, `Esc`, `Ctrl`, `Shift`, `Alt`, `Cmd`, `Tab`, `Space`, `Backspace`, `Delete`, `↑`, `↓`.

## Стиль

- Кнопки и пункты меню — инфинитив с заглавной буквы: «Сохранить», «Отменить».
- Подписи и заголовки — существительное с заглавной буквы: «Настройки», «Рабочая область».
- Подсказки и описания — обычное предложение, точка в конце, если это полное предложение.
- Многоточие — символ «…» (один символ), не три точки.
- Никаких точек в конце коротких подписей и кнопок.
- Плейсхолдеры `{name}`, `{count}`, `{total}`, `{value}`, `{action}` и т. п. сохранять дословно, не менять регистр и не переводить имена внутри.
- Если строка — только плейсхолдер или бренд, оставить как есть.
- Числа и единицы: «{value} тыс.», «{value} млн», «{count} символов».
