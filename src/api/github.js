import axios from 'axios';

const GITHUB_API = 'https://api.github.com';
const OWNER = import.meta.env.VITE_GITHUB_OWNER;
const REPO = import.meta.env.VITE_GITHUB_REPO;
const BOOKS_PATH = import.meta.env.VITE_GITHUB_PATH || 'books';
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
