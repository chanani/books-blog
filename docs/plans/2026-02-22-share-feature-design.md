# Share Feature Design

## Overview
챕터 페이지와 책 상세 페이지에 공유 기능을 추가한다.

## Scope
- **챕터 페이지**: 글 본문 아래, 댓글(Giscus) 위
- **책 상세 페이지**: 챕터 목록 아래

## Share Channels
| Channel | Desktop | Mobile |
|---------|---------|--------|
| URL 복사 | clipboard API | clipboard API |
| 카카오톡 | URL 복사 + 토스트 안내 | Web Share API (네이티브 시트) |
| X (Twitter) | `intent/tweet` URL 새 창 | 동일 |
| Facebook | `sharer.php` URL 새 창 | 동일 |
| Instagram | URL 복사 + 토스트 안내 | Web Share API (네이티브 시트) |

## UI Layout
- 글 하단에 "이 글 공유하기" 섹션 배치
- 원형 아이콘 버튼 가로 배열 + 아래 라벨
- 각 채널 브랜드 색상 적용
- 다크모드 대응
- 토스트 메시지: 화면 하단 중앙, 2초 후 자동 사라짐

## Share Data
- **title**: `{chapterTitle} - 차나니의 책방` 또는 `{bookTitle} - 차나니의 책방`
- **url**: 현재 페이지 URL (canonical)
- **description**: Helmet에 설정된 description

## Components
- `ShareSection` - 공유 버튼 영역 (재사용 컴포넌트)
- 토스트는 기존 CSS 인라인 방식 활용

## Files to Modify
1. `src/page/_components/share/ShareSection.jsx` (신규)
2. `src/page/_components/share/ShareSection.css` (신규)
3. `src/page/chapter/Chapter.jsx` (ShareSection 삽입)
4. `src/page/book/Book.jsx` (ShareSection 삽입)
