# dsh-locale-ru — русская локализация DeepSeek Harness

Плагин-языковой пакет для веб-интерфейса [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH):
добавляет локаль `ru` в реестр локалей и регистрирует русские словари для всех штатных
пространств имён интерфейса.

- **64 пространства имён, 2739 строк** — чат, композер, очередь сообщений, инструменты,
  настройки (аккаунт, модели, тема, оболочка, плагины, веб-поиск), боковые панели,
  просмотр документов, терминал, браузер, расписание, субагенты, команды, онбординг.
- Работает как обычный клиентский плагин DSH: **не патчит `app.asar`**, не ломает
  целостность приложения и переживает его обновления.
- Непокрытые ключи автоматически падают в английский (цепочка `ru → en`), поэтому
  недоперевод ничего не ломает.

## Установка

Нужен DSH с профилем `desktop` и доступный `pnpm` (в поставке DSH он уже есть).

### Вариант 1. Скриптом

```powershell
git clone https://github.com/<user>/dsh-locale-ru.git
cd dsh-locale-ru
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

Скрипт поставит пакет в `%USERPROFILE%\.dsh\profiles\desktop`, добавит запись
`- insert: - id: dsh-locale-ru` в `cordis.patch.yml` и выставит `locale.preference: ru`.
После этого перезапустите DSH.

### Вариант 2. Вручную

```powershell
cd $env:USERPROFILE\.dsh\profiles\desktop
pnpm add file:C:\path\to\dsh-locale-ru
```

и добавьте в `cordis.patch.yml`:

```yaml
- insert:
    - id: dsh-locale-ru
      name: "dsh-locale-ru"
```

а в существующую запись `locale` — `preference: ru`.

### Включение языка

**Настройки → Общие → Язык → Русский** (или перезапуск — подхватится сохранённый выбор).

## Откат

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\rollback.ps1
```

Убирает вставку из профиля и возвращает `locale.preference: en`. Полное удаление —
`pnpm remove dsh-locale-ru` в папке профиля.

## Как это устроено

`lib/client.js` — браузерная половина плагина. При загрузке он:

1. вызывает `ctx.locale.addLanguage({ id: "ru", label: "Русский", fallback: "en" })`;
2. для каждого пространства имён регистрирует словарь `ru`
   через `ctx.locale.register(ns, "ru", dict)`.

Каждая регистрация обёрнута в `try/catch`: сбой одного словаря не ломает остальной
интерфейс. `lib/index.js` — пустая хостовая половина, нужная только затем, чтобы
Loader мог собрать дерево (`dsh.client` в `package.json` объявляет браузерный бандл).

## Обновление перевода

Исходные английские строки извлекаются прямо из поставки DSH, поэтому перевод можно
обновлять под новые версии:

| Шаг | Команда | Что делает |
|---|---|---|
| 1 | `node tools/extract-client.mjs ["E:\DeepSeek\resources\app.asar"]` | достаёт все `lib/client.js` в `tools/client/` |
| 2 | `node tools/extract-i18n.mjs` | собирает словари `zh`/`en` в `i18n/dicts.json` |
| 3 | `node tools/make-chunks.mjs` | режет строки на куски `i18n/work/chunk-NN.json` |
| 4 | — | перевод в `i18n/work/part-NN.json` по глоссарию `i18n/GLOSSARY.md` |
| 5 | `node tools/verify-part.mjs <part> <chunk>` | проверяет ключи и плейсхолдеры |
| 6 | `node tools/merge-parts.mjs` | собирает `i18n/ru/<ns>.json` |
| 7 | `node tools/build-plugin.mjs` | генерирует `lib/client.js` |
| 8 | `node tools/fake-load.mjs` | проверяет бандл в фейковом ModuleLoader |

После пересборки обновите установленную копию в профиле (`pnpm remove` + `pnpm add`):
pnpm кеширует снимок каталога по версии, поэтому при правках поднимайте `version`
в `package.json`.

Глоссарий и правила оформления — [`i18n/GLOSSARY.md`](i18n/GLOSSARY.md).

## Ограничения

- **Нативное меню Electron** (`Application`, `Edit`, `View`, …) рисуется главным
  процессом приложения и не относится к веб-интерфейсу — пакет его не переводит.
  Для локализации меню пришлось бы править `app.asar`, что ломает целостность
  пакета и автообновления.
- Строки, приходящие с хоста (описания плагинов из их `package.json`, часть
  системных сообщений, имена инструментов и моделей), остаются английскими.
- Копия, зарегистрированная в реестре команд, кешируется на момент регистрации
  и не переключается на лету — ограничение самого `dsh-client-locale`.

## Лицензия

MIT.
