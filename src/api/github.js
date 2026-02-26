import axios from 'axios';

const GITHUB_API = 'https://api.github.com';
const OWNER = import.meta.env.VITE_GITHUB_OWNER;
const REPO = import.meta.env.VITE_GITHUB_REPO;
const BOOKS_PATH = import.meta.env.VITE_GITHUB_PATH || 'books';
const DEV_PATH = 'dev';
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

const githubApi = axios.create({
  baseURL: GITHUB_API,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  },
});

function decodeBase64(encoded) {
  const cleaned = encoded.replace(/\n/g, '');
  const bytes = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

function findCover(files) {
  const cover = files.find(
    (f) => f.type === 'file' && /^cover\.(png|jpe?g|webp|gif|svg)$/i.test(f.name),
  );
  return cover?.download_url || '';
}

function formatChapterName(filename) {
  let name = filename.replace(/\.md$/, '');
  name = name.replace(/^\d+-?/, '');
  name = name
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return name || filename;
}

function getChapterOrder(filename) {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

// Strip markdown syntax to get plain text
export function stripMarkdown(content) {
  return content
    .replace(/```[\s\S]*?```/g, '')       // code blocks
    .replace(/`[^`]+`/g, '')              // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '')       // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links → text
    .replace(/#{1,6}\s+/g, '')             // headings
    .replace(/[*_~]{1,3}(.*?)[*_~]{1,3}/g, '$1') // bold/italic/strikethrough
    .replace(/^\s*[-*+]\s+/gm, '')         // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, '')         // ordered list markers
    .replace(/^\s*>\s+/gm, '')             // blockquotes
    .replace(/\|.*\|/g, '')                // tables
    .replace(/[-=]{3,}/g, '')              // horizontal rules
    .replace(/\n{2,}/g, '\n')             // collapse blank lines
    .trim();
}

// Fetch all chapter contents with concurrency limit
export async function fetchAllChapterContents(books, onProgress) {
  const results = [];
  let completed = 0;
  const total = { value: 0 };

  // First, gather all chapter entries per book
  const bookChapterEntries = await Promise.all(
    books.map(async (book) => {
      try {
        const basePath = `${BOOKS_PATH}/${book.slug}`;
        const { data: entries } = await githubApi.get(
          `/repos/${OWNER}/${REPO}/contents/${basePath}`,
        );

        const chapters = [];
        const subDirs = [];

        for (const entry of entries) {
          if (entry.type === 'file' && entry.name.endsWith('.md') && entry.name !== 'index.md') {
            chapters.push({
              name: formatChapterName(entry.name),
              path: entry.name.replace(/\.md$/, ''),
              filePath: `${basePath}/${entry.name}`,
            });
          } else if (entry.type === 'dir') {
            subDirs.push(entry.name);
          }
        }

        // Fetch subdirectory chapters
        const subResults = await Promise.all(
          subDirs.map(async (folderName) => {
            try {
              const { data: subEntries } = await githubApi.get(
                `/repos/${OWNER}/${REPO}/contents/${basePath}/${folderName}`,
              );
              return subEntries
                .filter((e) => e.type === 'file' && e.name.endsWith('.md'))
                .map((e) => ({
                  name: formatChapterName(e.name),
                  path: `${folderName}/${e.name.replace(/\.md$/, '')}`,
                  filePath: `${basePath}/${folderName}/${e.name}`,
                }));
            } catch {
              return [];
            }
          }),
        );

        subResults.forEach((sub) => chapters.push(...sub));

        return { book, chapters };
      } catch {
        return { book, chapters: [] };
      }
    }),
  );

  // Count total chapters
  const allTasks = [];
  for (const { book, chapters } of bookChapterEntries) {
    for (const ch of chapters) {
      allTasks.push({ book, chapter: ch });
    }
  }
  total.value = allTasks.length;
  onProgress?.(0, total.value);

  // Fetch content with concurrency limit of 5
  const concurrency = 5;
  let cursor = 0;

  async function runNext() {
    while (cursor < allTasks.length) {
      const idx = cursor++;
      const { book, chapter } = allTasks[idx];
      try {
        const { data } = await githubApi.get(
          `/repos/${OWNER}/${REPO}/contents/${chapter.filePath}`,
        );
        const content = decodeBase64(data.content);
        const plainText = stripMarkdown(content);

        results.push({
          bookSlug: book.slug,
          bookTitle: book.title,
          chapterPath: chapter.path,
          chapterName: chapter.name,
          plainText,
        });
      } catch {
        // skip failed chapters
      }
      completed++;
      onProgress?.(completed, total.value);
    }
  }

  const workers = Array.from({ length: concurrency }, () => runNext());
  await Promise.all(workers);

  return results;
}

// Fetch all books
export async function fetchBookList() {
  const { data: dirs } = await githubApi.get(
    `/repos/${OWNER}/${REPO}/contents/${BOOKS_PATH}`,
  );

  const bookDirs = dirs.filter((d) => d.type === 'dir');

  const books = await Promise.all(
    bookDirs.map(async (dir) => {
      try {
        // List book folder to find info.json + cover image
        const { data: files } = await githubApi.get(dir.url);

        const infoEntry = files.find((f) => f.name === 'info.json');
        let info = { title: dir.name.replace(/[-_]/g, ' ') };
        if (infoEntry) {
          const { data: infoData } = await githubApi.get(infoEntry.url);
          info = JSON.parse(decodeBase64(infoData.content));
        }

        return {
          slug: dir.name,
          cover: findCover(files),
          ...info,
        };
      } catch {
        return {
          slug: dir.name,
          title: dir.name.replace(/[-_]/g, ' '),
          cover: '',
        };
      }
    }),
  );

  return books.sort((a, b) => {
    if (a.date && b.date) return new Date(b.date) - new Date(a.date);
    return (a.title || '').localeCompare(b.title || '');
  });
}

// Fetch book detail: info + chapter list
export async function fetchBookDetail(bookSlug) {
  const basePath = `${BOOKS_PATH}/${bookSlug}`;

  const { data: entries } = await githubApi.get(
    `/repos/${OWNER}/${REPO}/contents/${basePath}`,
  );

  // info.json
  const infoEntry = entries.find((e) => e.name === 'info.json');
  let info = { title: bookSlug };
  if (infoEntry) {
    const { data: infoData } = await githubApi.get(infoEntry.url);
    info = JSON.parse(decodeBase64(infoData.content));
  }

  // Cover
  const cover = findCover(entries);

  // Chapters
  const chapters = [];
  const subDirs = [];

  for (const entry of entries) {
    if (
      entry.type === 'file' &&
      entry.name.endsWith('.md') &&
      entry.name !== 'index.md'
    ) {
      chapters.push({
        name: formatChapterName(entry.name),
        fileName: entry.name,
        path: entry.name.replace(/\.md$/, ''),
        order: getChapterOrder(entry.name),
        folder: null,
      });
    } else if (entry.type === 'dir') {
      subDirs.push(entry.name);
    }
  }

  // Subdirectory chapters
  const subResults = await Promise.all(
    subDirs.map(async (folderName) => {
      try {
        const { data: subEntries } = await githubApi.get(
          `/repos/${OWNER}/${REPO}/contents/${basePath}/${folderName}`,
        );
        return subEntries
          .filter((e) => e.type === 'file' && e.name.endsWith('.md'))
          .map((e) => ({
            name: formatChapterName(e.name),
            fileName: e.name,
            path: `${folderName}/${e.name.replace(/\.md$/, '')}`,
            order: getChapterOrder(e.name),
            folder: folderName
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase()),
          }));
      } catch {
        return [];
      }
    }),
  );

  subResults.forEach((sub) => chapters.push(...sub));

  // Fetch last commit date for each chapter
  await Promise.all(
    chapters.map(async (ch) => {
      try {
        const filePath = `${basePath}/${ch.path}.md`;
        const { data: commits } = await githubApi.get(
          `/repos/${OWNER}/${REPO}/commits`,
          { params: { path: filePath, per_page: 1 } },
        );
        ch.date = commits[0]
          ? formatDate(commits[0].commit.committer.date)
          : '';
      } catch {
        ch.date = '';
      }
    }),
  );

  const rootChapters = chapters
    .filter((c) => !c.folder)
    .sort((a, b) => a.order - b.order);

  const folderGroups = {};
  chapters
    .filter((c) => c.folder)
    .sort((a, b) => a.order - b.order)
    .forEach((c) => {
      if (!folderGroups[c.folder]) folderGroups[c.folder] = [];
      folderGroups[c.folder].push(c);
    });

  return {
    slug: bookSlug,
    cover,
    ...info,
    rootChapters,
    folderGroups,
    totalChapters: chapters.length,
  };
}

// Fetch discussion comment counts from giscus (GitHub Discussions)
const BLOG_REPO = 'books-blog';
const DISCUSSION_CATEGORY_ID = 'DIC_kwDORI3Ks84C15da';

export async function fetchDiscussionCounts(bookSlug) {
  if (!TOKEN) return {};

  try {
    const query = `{
      repository(owner: "${OWNER}", name: "${BLOG_REPO}") {
        discussions(first: 100, categoryId: "${DISCUSSION_CATEGORY_ID}") {
          nodes {
            title
            comments { totalCount }
          }
        }
      }
    }`;

    const { data } = await axios.post(
      'https://api.github.com/graphql',
      { query },
      { headers: { Authorization: `Bearer ${TOKEN}` } },
    );

    const discussions = data.data?.repository?.discussions?.nodes || [];
    const counts = {};
    const prefix = `book/${bookSlug}/read/`;

    for (const d of discussions) {
      let title;
      try {
        title = decodeURIComponent(d.title.replace(/^\//, ''));
      } catch {
        title = d.title.replace(/^\//, '');
      }

      if (title.startsWith(prefix)) {
        const chapterPath = title.slice(prefix.length);
        counts[chapterPath] = (counts[chapterPath] || 0) + d.comments.totalCount;
      }
    }

    return counts;
  } catch {
    return {};
  }
}

// Fetch dev discussion comment counts from giscus (GitHub Discussions)
export async function fetchDevDiscussionCounts() {
  if (!TOKEN) return {};

  try {
    const query = `{
      repository(owner: "${OWNER}", name: "${BLOG_REPO}") {
        discussions(first: 100, categoryId: "${DISCUSSION_CATEGORY_ID}") {
          nodes {
            title
            comments { totalCount }
          }
        }
      }
    }`;

    const { data } = await axios.post(
      'https://api.github.com/graphql',
      { query },
      { headers: { Authorization: `Bearer ${TOKEN}` } },
    );

    const discussions = data.data?.repository?.discussions?.nodes || [];
    const counts = {};
    const prefix = 'post/';

    for (const d of discussions) {
      let title;
      try {
        title = decodeURIComponent(d.title.replace(/^\//, ''));
      } catch {
        title = d.title.replace(/^\//, '');
      }

      if (title.startsWith(prefix)) {
        const key = title.slice(prefix.length);
        counts[key] = (counts[key] || 0) + d.comments.totalCount;
      }
    }

    return counts;
  } catch {
    return {};
  }
}

// Fetch commit dates (first = created, last = updated)
async function fetchCommitDates(filePath) {
  try {
    const { data: commits } = await githubApi.get(
      `/repos/${OWNER}/${REPO}/commits`,
      { params: { path: filePath, per_page: 1 } },
    );
    const lastCommit = commits[0];
    if (!lastCommit) return { createdAt: '', updatedAt: '' };

    const updatedAt = lastCommit.commit.committer.date;

    // Get first commit (created date)
    const linkHeader = commits.__headers?.link || '';
    let createdAt = updatedAt;

    // If there's pagination, fetch the last page for the first commit
    const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
    if (lastPageMatch) {
      const { data: firstCommits } = await githubApi.get(
        `/repos/${OWNER}/${REPO}/commits`,
        { params: { path: filePath, per_page: 1, page: lastPageMatch[1] } },
      );
      if (firstCommits[0]) {
        createdAt = firstCommits[0].commit.committer.date;
      }
    }

    return { createdAt, updatedAt };
  } catch {
    return { createdAt: '', updatedAt: '' };
  }
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

// Parse YAML frontmatter from markdown content
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const yamlBlock = match[1];
  const body = match[2];
  const meta = {};

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle arrays like ["tag1", "tag2"]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }

    meta[key] = value;
  }

  return { meta, body };
}

// Find the first .md file in a list of GitHub entries
function findMarkdown(files) {
  return files.find((f) => f.type === 'file' && f.name.endsWith('.md'));
}

// Fetch dev post list from dev/ folder
// Supports two formats:
//   1. dev/category/post-name.md          (flat file, no cover)
//   2. dev/category/post-name/any.md      (folder with any .md + optional cover image)
export async function fetchDevPostList() {
  try {
    const { data: categories } = await githubApi.get(
      `/repos/${OWNER}/${REPO}/contents/${DEV_PATH}`,
    );

    const categoryDirs = categories.filter((d) => d.type === 'dir');
    const posts = [];

    await Promise.all(
      categoryDirs.map(async (dir) => {
        try {
          const { data: entries } = await githubApi.get(
            `/repos/${OWNER}/${REPO}/contents/${DEV_PATH}/${dir.name}`,
          );

          const tasks = entries.map(async (entry) => {
            try {
              // Case 1: flat .md file
              if (entry.type === 'file' && entry.name.endsWith('.md')) {
                const { data: fileData } = await githubApi.get(entry.url);
                const content = decodeBase64(fileData.content);
                const { meta } = parseFrontmatter(content);

                posts.push({
                  slug: entry.name.replace(/\.md$/, ''),
                  category: dir.name,
                  title: meta.title || entry.name.replace(/\.md$/, ''),
                  date: meta.date || '',
                  tags: Array.isArray(meta.tags) ? meta.tags : [],
                  description: meta.description || '',
                  cover: '',
                });
                return;
              }

              // Case 2: folder with any .md + optional cover image
              if (entry.type === 'dir') {
                const { data: folderFiles } = await githubApi.get(
                  `/repos/${OWNER}/${REPO}/contents/${DEV_PATH}/${dir.name}/${entry.name}`,
                );

                const mdFile = findMarkdown(folderFiles);
                if (!mdFile) return;

                const { data: fileData } = await githubApi.get(mdFile.url);
                const content = decodeBase64(fileData.content);
                const { meta } = parseFrontmatter(content);
                const cover = findCover(folderFiles);

                posts.push({
                  slug: entry.name,
                  category: dir.name,
                  title: meta.title || entry.name,
                  date: meta.date || '',
                  tags: Array.isArray(meta.tags) ? meta.tags : [],
                  description: meta.description || '',
                  cover,
                });
              }
            } catch {
              // skip failed entries
            }
          });

          await Promise.all(tasks);
        } catch {
          // skip failed directories
        }
      }),
    );

    return posts.sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date);
      return a.title.localeCompare(b.title);
    });
  } catch {
    return [];
  }
}

// Fetch a single dev post
// Tries folder format first (finds any .md inside), falls back to flat file (slug.md)
export async function fetchDevPost(category, slug) {
  let rawContent;
  let cover = '';
  let mdFilePath;

  try {
    // Try folder format first: dev/category/slug/
    const folderPath = `${DEV_PATH}/${category}/${slug}`;
    const { data: folderFiles } = await githubApi.get(
      `/repos/${OWNER}/${REPO}/contents/${folderPath}`,
    );

    const mdFile = findMarkdown(folderFiles);
    if (!mdFile) throw new Error('No .md file found');

    cover = findCover(folderFiles);
    mdFilePath = `${folderPath}/${mdFile.name}`;

    const { data: fileData } = await githubApi.get(mdFile.url);
    rawContent = decodeBase64(fileData.content);
  } catch {
    // Fall back to flat file: dev/category/slug.md
    mdFilePath = `${DEV_PATH}/${category}/${slug}.md`;
    const { data: fileData } = await githubApi.get(
      `/repos/${OWNER}/${REPO}/contents/${mdFilePath}`,
    );
    rawContent = decodeBase64(fileData.content);
  }

  const dates = await fetchCommitDates(mdFilePath);
  const { meta, body } = parseFrontmatter(rawContent);

  return {
    slug,
    category,
    title: meta.title || slug,
    date: meta.date || '',
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    description: meta.description || '',
    cover,
    content: body,
    createdAt: formatDate(dates.createdAt),
    updatedAt: formatDate(dates.updatedAt),
  };
}

// Fetch a single chapter
export async function fetchChapter(bookSlug, chapterPath) {
  const filePath = `${BOOKS_PATH}/${bookSlug}/${chapterPath}.md`;

  const [fileRes, dates] = await Promise.all([
    githubApi.get(`/repos/${OWNER}/${REPO}/contents/${filePath}`),
    fetchCommitDates(filePath),
  ]);

  const content = decodeBase64(fileRes.data.content);
  const fileName = fileRes.data.name;

  return {
    bookSlug,
    path: chapterPath,
    fileName,
    title: formatChapterName(fileName),
    content,
    createdAt: formatDate(dates.createdAt),
    updatedAt: formatDate(dates.updatedAt),
  };
}
