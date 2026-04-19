# Practice 2 Report Plan

This file stores the final writing plan for the second practice documents. It is intended to make the next writing session fast and consistent with the first-practice style.

## Formal Details

- Student: Ахметов Камиль Ильшатович
- Group: 09-231
- Practice type: эксплуатационная производственная практика
- Practice dates: 26.03.2026 - 22.04.2026
- Place: КФУ, Институт ВМиИТ, кафедра системного анализа и информационных технологий
- Scientific supervisor: доцент кафедры САИТ, Андрианова А.А.
- Department practice supervisor: ст.преподаватель кафедры САИТ Тихонова О.О.
- Output folder: `files/Практика 2/Ахметов Камиль`
- Output format: DOCX only. PDF will be exported manually later.

## Source Documents

Use these documents as the main style and formatting references:

- `files/Ахметов_Камиль_Ильшатович/в3.Дневник_студента_ФИИТ_ПТП_231_Ахметов.docx`
- `files/Ахметов_Камиль_Ильшатович/в2.Индивидуальное_задание_ФИИТ_ПТП_231_Ахметов.docx`
- `files/Ахметов_Камиль_Ильшатович/в2.Отчет_студента_ФИИТ_ПТП_231_Ахметов.docx`
- `files/Практика 2/шаблоны/Дневник студента ФИИТ ЭП 231.docx`
- `files/Практика 2/шаблоны/Отчет студента ФИИТ ЭП 231.docx`
- `files/Практика 2/шаблоны/Оформление и содержание отчета ЭП.docx`
- `files/Практика 2/Пример Павлов/*.docx`

The Pavlov documents are useful for second-practice dates and structure, but not as a strict content or formatting source because they may contain mistakes.

## Writing Style

- Keep the tone close to the first-practice report: formal academic Russian, medium technical depth, no conversational phrasing.
- Do not repeat first-practice material except for a short retrospective in the introduction and first chapter.
- Avoid Russian tech slang. Prefer `frontend-часть`, `backend-часть`, `смарт-контракт`, `развертывание`, `объектное хранилище`, `политика доступа`, `пользовательский сценарий`.
- Do not insert code into the main text. Put code in the appendix.
- If the first-practice wording is reused, include a reference to the previous practice report as required by the formatting guide.
- Main text target: 13-16 pages without appendix.
- Appendix target: about 8 pages with new code fragments and file names.

## Individual Assignment

Practice period: `с 26.03.2026 по 22.04.2026`.

| No. | Individual assignment | Dates |
| --- | --- | --- |
| 1 | Первичная эксплуатация текущей версии платформы useContent, выявление ограничений существующей реализации, уточнение требований к пользовательским сценариям автора и подписчика | с 26.03.2026 по 31.03.2026 |
| 2 | Развитие архитектуры платформы и реализация frontend-части: backend-модулей контента, системы политик доступа и моделей подписок | с 01.04.2026 по 07.04.2026 |
| 3 | Реализация расширенной версии платформы: workspace автора и пользователя, ленты постов, проектов, файловой структуры, on-chain подписок и управления доступом | с 08.04.2026 по 17.04.2026 |
| 4 | Интеграция компонентов, проверка работоспособности, тестирование backend и smart contract, подготовка отчета и приложений | с 20.04.2026 по 22.04.2026 |

## Diary Entries

Use the same date set as Pavlov's second-practice diary. Do not include Sundays.

| Date | Work performed |
| --- | --- |
| 26 марта 2026 | Анализ текущего состояния платформы useContent после первого этапа практики, уточнение задач эксплуатационного этапа и направлений дальнейшей доработки. |
| 27 марта 2026 | Уточнение пользовательских сценариев автора и подписчика, определение требований к workspace, публикации контента и управлению доступом. |
| 30 марта 2026 | Анализ требований к frontend-части платформы, выбор структуры интерфейса, маршрутизации и подхода к подключению криптокошелька. |
| 31 марта 2026 | Проектирование расширенной архитектуры системы с учетом frontend-части, backend-модулей контента, смарт-контракта и объектного хранилища. |
| 1 апреля 2026 | Разработка базовой frontend-части на React: настройка проекта, маршрутизации, API-слоя, состояния авторизации и общего визуального каркаса. |
| 2 апреля 2026 | Реализация пользовательских и авторских разделов интерфейса, разделение сценариев пользователя и автора, настройка страницы профиля. |
| 3 апреля 2026 | Развитие backend-моделей пользователей, авторов, подписок, политик доступа, постов и проектов в MongoDB. |
| 6 апреля 2026 | Реализация системы сохраненных access policies, связывание политик доступа с постами, проектами и планами подписки. |
| 7 апреля 2026 | Разработка и настройка смарт-контракта SubscriptionManager для регистрации планов подписки и обработки платежей в сети EVM. |
| 8 апреля 2026 | Интеграция frontend-части с on-chain подписками: публикация плана, выбор сети и токена, подтверждение транзакции. |
| 9 апреля 2026 | Доработка backend-подтверждения платежей: чтение транзакций через RPC, проверка событий смарт-контракта и обновление прав доступа. |
| 10 апреля 2026 | Реализация workspace автора: настройки профиля, список подписчиков, управление планами, политиками доступа, постами и проектами. |
| 13 апреля 2026 | Реализация workspace пользователя: главная страница, профиль, список подписок, просмотр авторов и доступного контента. |
| 14 апреля 2026 | Доработка ленты постов, страницы отдельного поста, отображения уровней доступа, скрытия закрытого контента и пользовательских действий. |
| 15 апреля 2026 | Реализация лайков, комментариев, счетчика просмотров, архивирования и публикации постов с учетом прав доступа. |
| 16 апреля 2026 | Развитие проектной файловой структуры: папки, файлы, загрузка нескольких файлов, просмотр дерева, скачивание и доступ по политикам. |
| 17 апреля 2026 | Реализация прикрепления файлов и проектов к постам, предварительного просмотра медиафайлов и пользовательского просмотра материалов. |
| 20 апреля 2026 | Проверка интеграции frontend, backend, MongoDB, MinIO и смарт-контракта; исправление ошибок маршрутизации, подписок и доступа. |
| 21 апреля 2026 | Проведение тестирования backend-модулей и смарт-контракта, подготовка скриншотов, структуры отчета и материалов приложения. |
| 22 апреля 2026 | Финальная подготовка комплекта документов по практике: дневника, индивидуального задания, отчета, списка литературы и приложения. |

## Report Structure

### Introduction

Target size: 1-1.5 pages.

Main idea: the second practice continues the previous backend and infrastructure foundation and moves the project toward an exploitable end-to-end product version. Mention that the first practice focused on authentication, storage, files, infrastructure and the first contract prototype. The second practice focuses on frontend, content publishing, access policies, subscriptions, project files, smart contract integration and checks.

Goal: develop and verify an extended exploitable version of the useContent platform for managing and publishing digital content with access based on ownership and on-chain subscriptions.

Tasks:

- clarify functional requirements and user scenarios for author and subscriber roles;
- develop the frontend part and integrate wallet authentication;
- extend backend models and APIs for authors, users, posts, projects, policies and subscriptions;
- implement reusable access policies for content;
- implement and integrate the `SubscriptionManager` smart contract;
- implement post feeds, reactions, comments, project file trees and file previews;
- perform basic backend, smart contract and user-scenario checks;
- prepare report materials and appendix.

### 1. Development of Requirements and Platform Architecture

Target size: 3-4 pages.

Recommended subsections:

- `1.1. Уточнение функциональных требований`: author workspace, user workspace, posts, projects, subscriptions, hidden content, wallet login.
- `1.2. Архитектура frontend-части`: React, Vite, routes, API layer, TanStack Query, Zustand only for UI/session state, wagmi/viem, shadcn/Magic UI.
- `1.3. Развитие backend-части`: Encore.ts, MongoDB, content service, object storage, users, authors, posts, projects, access policies, subscription entitlements.
- `1.4. Модель управления доступом`: saved access policies, public/single/and/or, rules, subscription plans, connection to posts/projects and entitlements.

Recommended figures:

- `04_access_policies.png`
- optionally architecture screenshot/diagram if there is time.

### 2. Implementation of the Extended Platform Version

Target size: 5-6 pages.

Recommended subsections:

- `2.1. Авторский и пользовательский workspace`: onboarding, settings, author/public profile, subscribers, subscriptions, role switching.
- `2.2. Публикации и ленты контента`: draft, publish, archive, author feed, subscriber feed, global feed, post details.
- `2.3. Комментарии, реакции и просмотры`: likes, comments, view counter, author comment highlighting, access check before interaction.
- `2.4. Проекты и файловая структура`: project description, tags, folder tree, multi-file upload, MinIO storage, file preview, file/folder download, access policy checks.
- `2.5. On-chain подписки`: `SubscriptionManager`, plan registration, `planKey`, native and ERC-20 payments, 20% platform fee, 80% author payout, `SubscriptionPaid` event, `paidUntil`.
- `2.6. Развертывание и эксплуатационная инфраструктура`: very short subsection only. Mention that the frontend was added to `docker-compose`, a frontend `Dockerfile` and basic `nginx` config were prepared, and smart contract deployment was moved to a manual controlled workflow. Do not expand this into a separate infrastructure-heavy section.

Recommended figures:

- `01_user_home.png`
- `02_author_onboarding.png`
- `03_author_workspace.png`
- `04_access_policies.png`
- `05_subscription_plan_publish.png`
- `06_rabby_contract_signature.png`
- `07_author_public_profile.png`
- `08_post_feed.png`
- `09_post_details_comments.png`
- `10_project_tree.png`
- `11_project_file_preview.png`

### 3. Verification and Testing

Target size: 2-3 pages.

Recommended subsections:

- `3.1. Backend-тестирование`: access evaluator, content service, policies, subscriptions, archives, payment confirmation idempotency.
- `3.2. Тестирование смарт-контракта`: Hardhat tests for plan registration/update, native and ERC-20 payments, fee distribution, active/inactive plans, paidUntil renewal.
- `3.3. Проверка пользовательских сценариев`: wallet login, author creation, access policy setup, plan publishing, subscription, locked/unlocked content, project file tree.

Recommended figures:

- `12_backend_tests.png`
- `13_solidity_tests.png`

### Conclusion

Target size: 1.5-2 pages including competency table.

Main idea: the second practice transformed the project from a backend-oriented prototype into a more complete platform version with frontend, content flows, access policies, on-chain subscription payments, project file management and basic verification.

Competencies table should use the second-practice template competencies:

- УК-1
- ПК-1
- ПК-2
- ПК-3
- ПК-4

### References

Use at least 8-10 sources:

- Encore.ts documentation
- React documentation
- Vite documentation
- TanStack Query documentation
- wagmi documentation
- viem documentation
- Solidity documentation
- Hardhat documentation
- OpenZeppelin documentation
- MongoDB documentation
- MinIO documentation
- Docker documentation
- GitHub Actions documentation

Dates of access should be close to the writing date or the practice period, for example `19.04.2026`.

## Screenshots

Create screenshots in `files/Практика 2/Ахметов Камиль/screens`.

| File | Capture | Report use |
| --- | --- | --- |
| `01_user_home.png` | User home page after wallet login | Section 2.1 |
| `02_author_onboarding.png` | Author onboarding form | Section 2.1 |
| `03_author_workspace.png` | Author workspace with metrics | Section 2.1 |
| `04_access_policies.png` | Access page with plans and saved policies | Section 1.4 |
| `05_subscription_plan_publish.png` | On-chain plan form or publish state | Section 2.5 |
| `06_rabby_contract_signature.png` | Rabby Wallet transaction/signature confirmation for plan publishing or subscription payment | Section 2.5 |
| `07_author_public_profile.png` | Public author page with access tiers | Sections 2.1/2.5 |
| `08_post_feed.png` | Post feed with access/tier badge | Section 2.2 |
| `09_post_details_comments.png` | Post details with likes and comments | Section 2.3 |
| `10_project_tree.png` | Project file tree | Section 2.4 |
| `11_project_file_preview.png` | File preview or download flow | Section 2.4 |
| `12_backend_tests.png` | Successful backend tests | Section 3.1 |
| `13_solidity_tests.png` | Successful Hardhat tests | Section 3.2 |

If the report becomes too large, keep these priority figures:

- access policies
- Rabby Wallet contract signature
- author workspace
- public author page
- post details
- project tree
- backend tests
- smart contract tests

## Appendix Code Candidates

Do not insert all files completely. Use selected fragments with file headings.

| File | Reason |
| --- | --- |
| `solidity/contracts/SubscriptionManager.sol` | Main new on-chain subscription logic |
| `backend/domain/access.ts` | Access policy evaluation |
| `backend/content/onchain.ts` | Smart contract event verification |
| `backend/content/content.service.ts` | Policies, subscriptions, posts/projects, access checks |
| `frontend/src/components/subscriptions/OnChainPlanPublisher.tsx` | Author-side on-chain plan publishing |
| `frontend/src/components/subscriptions/SubscribeButton.tsx` | Subscriber payment flow |
| `frontend/src/components/posts/PostComposer.tsx` | Post creation, attachments, policies |
| `frontend/src/components/posts/PostFeed.tsx` | Feed rendering, tiers, hidden content, reactions |
| `frontend/src/components/project-tree/ProjectFileTree.tsx` | Project file tree, upload, preview, download |
| `frontend/Dockerfile`, `frontend/nginx.conf`, `docker-compose.yml` | Only if appendix space remains: short deployment configuration fragments for frontend container and nginx |

Appendix formatting:

- Heading before each fragment: `Файл ...`
- Code font: Courier New 12
- Line spacing: 1
- Main report font: Times New Roman 14
- Main report line spacing: 1.5
- Main report text alignment: justified

## Testing Evidence

Recommended commands/screenshots:

- Backend: `cd backend && npm test -- --run`
- Backend TypeScript check: `cd backend && npx tsc --noEmit`
- Frontend build: `cd frontend && npm run build`
- Frontend lint: `cd frontend && npm run lint`
- Frontend format check: `cd frontend && npx prettier --check .`
- Solidity tests: `cd solidity && npm test`

Mention frontend tests carefully: there are build/lint/smoke checks now. If React component tests are added before final writing, include them; otherwise do not claim they exist.

## Generated DOCX Plan

When writing starts:

1. Use second-practice templates as the base DOCX files.
2. Preserve formal pages, signatures, margins, font and table style.
3. Generate three working DOCX files:
   - `files/Практика 2/Ахметов Камиль/Индивидуальное_задание_ФИИТ_ЭП_231_Ахметов.docx`
   - `files/Практика 2/Ахметов Камиль/Дневник_студента_ФИИТ_ЭП_231_Ахметов.docx`
   - `files/Практика 2/Ахметов Камиль/Отчет_студента_ФИИТ_ЭП_231_Ахметов.docx`
4. Do not generate PDF.
