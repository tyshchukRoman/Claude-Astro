#!/usr/bin/env node
/**
 * WordPress WXR XML to Astro TypeScript Converter
 *
 * Parses WordPress export files (WXR format) and generates:
 * - src/data/posts.ts - Blog posts
 * - src/data/pages.ts - Static pages
 * - src/data/categories.ts - Categories
 * - src/data/tags.ts - Tags
 * - src/data/authors.ts - Authors
 * - Downloads media to public/images/
 *
 * Usage: node scripts/wp-to-astro.js path/to/wordpress-export.xml
 *
 * Options:
 *   --dry-run       Parse and show summary without writing files
 *   --skip-media    Skip downloading media files
 *   --output-dir    Custom output directory (default: src/data)
 *   --media-dir     Custom media directory (default: public/images)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, createWriteStream, unlinkSync } from 'fs';
import { join, basename, extname } from 'path';
import https from 'https';
import http from 'http';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  outputDir: './src/data',
  mediaDir: './public/images',
  dryRun: false,
  skipMedia: false,
  maxConcurrentDownloads: 5,
};

// Parse command line arguments
const args = process.argv.slice(2);
let xmlPath = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--dry-run') {
    CONFIG.dryRun = true;
  } else if (arg === '--skip-media') {
    CONFIG.skipMedia = true;
  } else if (arg === '--output-dir' && args[i + 1]) {
    CONFIG.outputDir = args[++i];
  } else if (arg === '--media-dir' && args[i + 1]) {
    CONFIG.mediaDir = args[++i];
  } else if (!arg.startsWith('--')) {
    xmlPath = arg;
  }
}

if (!xmlPath) {
  console.error('Usage: node scripts/wp-to-astro.js <wordpress-export.xml> [options]');
  console.error('\nOptions:');
  console.error('  --dry-run       Parse and show summary without writing files');
  console.error('  --skip-media    Skip downloading media files');
  console.error('  --output-dir    Custom output directory (default: src/data)');
  console.error('  --media-dir     Custom media directory (default: public/images)');
  process.exit(1);
}

// ============================================================================
// XML Parsing
// ============================================================================

/**
 * Parse WordPress WXR XML export
 */
function parseWXR(xml) {
  const result = {
    siteInfo: extractSiteInfo(xml),
    authors: extractAuthors(xml),
    categories: extractCategories(xml),
    tags: extractTags(xml),
    items: extractItems(xml),
  };
  return result;
}

function extractSiteInfo(xml) {
  return {
    title: getTagValue(xml, 'title'),
    link: getTagValue(xml, 'link'),
    description: getTagValue(xml, 'description'),
    language: getTagValue(xml, 'language'),
  };
}

function extractAuthors(xml) {
  const authors = [];
  const authorRegex = /<wp:author>([\s\S]*?)<\/wp:author>/g;
  let match;

  while ((match = authorRegex.exec(xml)) !== null) {
    const authorXml = match[1];
    authors.push({
      id: getTagValue(authorXml, 'wp:author_id'),
      login: getCDATAValue(authorXml, 'wp:author_login'),
      email: getCDATAValue(authorXml, 'wp:author_email'),
      displayName: getCDATAValue(authorXml, 'wp:author_display_name'),
      firstName: getCDATAValue(authorXml, 'wp:author_first_name'),
      lastName: getCDATAValue(authorXml, 'wp:author_last_name'),
    });
  }

  return authors;
}

function extractCategories(xml) {
  const categories = [];
  const catRegex = /<wp:category>([\s\S]*?)<\/wp:category>/g;
  let match;

  while ((match = catRegex.exec(xml)) !== null) {
    const catXml = match[1];
    categories.push({
      id: getTagValue(catXml, 'wp:term_id'),
      slug: getCDATAValue(catXml, 'wp:category_nicename'),
      name: getCDATAValue(catXml, 'wp:cat_name'),
      parent: getCDATAValue(catXml, 'wp:category_parent'),
      description: getCDATAValue(catXml, 'wp:category_description'),
    });
  }

  return categories;
}

function extractTags(xml) {
  const tags = [];
  const tagRegex = /<wp:tag>([\s\S]*?)<\/wp:tag>/g;
  let match;

  while ((match = tagRegex.exec(xml)) !== null) {
    const tagXml = match[1];
    tags.push({
      id: getTagValue(tagXml, 'wp:term_id'),
      slug: getCDATAValue(tagXml, 'wp:tag_slug'),
      name: getCDATAValue(tagXml, 'wp:tag_name'),
      description: getCDATAValue(tagXml, 'wp:tag_description'),
    });
  }

  return tags;
}

function extractItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    items.push(parseItem(match[1]));
  }

  return items;
}

function parseItem(itemXml) {
  // Extract categories and tags from this item
  const itemCategories = [];
  const itemTags = [];
  const catRegex = /<category domain="(category|post_tag)" nicename="([^"]+)"><!\[CDATA\[([^\]]+)\]\]><\/category>/g;
  let catMatch;

  while ((catMatch = catRegex.exec(itemXml)) !== null) {
    if (catMatch[1] === 'category') {
      itemCategories.push({ slug: catMatch[2], name: catMatch[3] });
    } else {
      itemTags.push({ slug: catMatch[2], name: catMatch[3] });
    }
  }

  // Extract all postmeta
  const postmeta = {};
  const metaRegex = /<wp:postmeta>[\s\S]*?<wp:meta_key><!\[CDATA\[([^\]]+)\]\]><\/wp:meta_key>[\s\S]*?<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>[\s\S]*?<\/wp:postmeta>/g;
  let metaMatch;

  while ((metaMatch = metaRegex.exec(itemXml)) !== null) {
    postmeta[metaMatch[1]] = metaMatch[2];
  }

  return {
    // Core fields
    id: getTagValue(itemXml, 'wp:post_id'),
    title: getCDATAValue(itemXml, 'title') || getTagValue(itemXml, 'title'),
    link: getTagValue(itemXml, 'link'),
    pubDate: getTagValue(itemXml, 'pubDate'),
    creator: getCDATAValue(itemXml, 'dc:creator'),
    guid: getTagValue(itemXml, 'guid'),
    description: getCDATAValue(itemXml, 'description'),

    // Content
    content: getCDATAValue(itemXml, 'content:encoded'),
    excerpt: getCDATAValue(itemXml, 'excerpt:encoded'),

    // WordPress-specific
    postDate: getTagValue(itemXml, 'wp:post_date'),
    postDateGmt: getTagValue(itemXml, 'wp:post_date_gmt'),
    postType: getTagValue(itemXml, 'wp:post_type'),
    postName: getTagValue(itemXml, 'wp:post_name'), // slug
    status: getTagValue(itemXml, 'wp:status'),
    commentStatus: getTagValue(itemXml, 'wp:comment_status'),
    pingStatus: getTagValue(itemXml, 'wp:ping_status'),
    postParent: getTagValue(itemXml, 'wp:post_parent'),
    menuOrder: getTagValue(itemXml, 'wp:menu_order'),

    // Attachment-specific
    attachmentUrl: getTagValue(itemXml, 'wp:attachment_url'),

    // Taxonomy
    categories: itemCategories,
    tags: itemTags,

    // Custom fields
    postmeta,
    thumbnailId: postmeta['_thumbnail_id'] || null,
  };
}

// Helper: Get value from simple XML tag
function getTagValue(xml, tag) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(`<${escapedTag}[^>]*>([^<]*)</${escapedTag}>`));
  return match ? match[1].trim() : '';
}

// Helper: Get CDATA value from XML tag
function getCDATAValue(xml, tag) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cdataMatch = xml.match(new RegExp(`<${escapedTag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${escapedTag}>`));
  if (cdataMatch) return cdataMatch[1];

  // Fall back to regular value
  return getTagValue(xml, tag);
}

// ============================================================================
// Content Processing
// ============================================================================

/**
 * Convert WordPress HTML content to clean text/excerpt
 */
function stripHtml(html) {
  if (!html) return '';

  // Remove WordPress block comments
  let text = html.replace(/<!-- [\s\S]*? -->/g, '');

  // Remove script and style tags with content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Convert common block elements to newlines
  text = text.replace(/<\/(p|div|br|h[1-6]|li)>/gi, '\n');
  text = text.replace(/<(br|hr)\s*\/?>/gi, '\n');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.trim();

  return text;
}

/**
 * Generate excerpt from content
 */
function generateExcerpt(content, maxLength = 160) {
  const text = stripHtml(content);
  if (text.length <= maxLength) return text;

  // Cut at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'",
    '&#38;': '&',
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': ''',
    '&rsquo;': ''',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&hellip;': '…',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

  return result;
}

/**
 * Generate slug from title if not provided
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// ============================================================================
// Media Download
// ============================================================================

/**
 * Download a file with redirect handling
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) {
      resolve({ skipped: true, path: dest });
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const file = createWriteStream(dest);

    const request = protocol.get(url, { timeout: 30000 }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        file.close();
        try { unlinkSync(dest); } catch {}
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        } else {
          reject(new Error(`Redirect without location header: ${url}`));
        }
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        try { unlinkSync(dest); } catch {}
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve({ skipped: false, path: dest });
      });
    });

    request.on('error', (err) => {
      file.close();
      try { unlinkSync(dest); } catch {}
      reject(err);
    });

    request.on('timeout', () => {
      request.destroy();
      file.close();
      try { unlinkSync(dest); } catch {}
      reject(new Error(`Timeout downloading: ${url}`));
    });
  });
}

/**
 * Download media with concurrency limit
 */
async function downloadMediaBatch(mediaItems, concurrency = 5) {
  const results = { success: 0, failed: 0, skipped: 0, errors: [] };

  for (let i = 0; i < mediaItems.length; i += concurrency) {
    const batch = mediaItems.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(item => downloadFile(item.url, item.dest))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          results.skipped++;
        } else {
          results.success++;
        }
      } else {
        results.failed++;
        results.errors.push({ url: batch[j].url, error: result.reason.message });
      }
    }

    // Progress update
    const processed = Math.min(i + concurrency, mediaItems.length);
    process.stdout.write(`\r  Progress: ${processed}/${mediaItems.length} files...`);
  }

  console.log(); // New line after progress
  return results;
}

// ============================================================================
// TypeScript Generation
// ============================================================================

/**
 * Generate posts.ts
 */
function generatePostsTS(posts, attachmentMap) {
  const processedPosts = posts.map(post => {
    const thumbnailUrl = post.thumbnailId ? attachmentMap.get(post.thumbnailId) : null;
    const thumbnail = thumbnailUrl
      ? `/images/posts/${sanitizeFilename(basename(new URL(thumbnailUrl).pathname))}`
      : '';

    return {
      slug: post.postName || generateSlug(post.title),
      title: post.title,
      date: post.postDate || post.pubDate,
      author: post.creator,
      excerpt: post.excerpt ? stripHtml(post.excerpt) : generateExcerpt(post.content),
      content: post.content, // Keep HTML for markdown conversion or direct rendering
      thumbnail,
      categories: post.categories.map(c => c.slug),
      tags: post.tags.map(t => t.slug),
    };
  });

  // Sort by date descending
  processedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return `// Auto-generated from WordPress export
// Run: node scripts/wp-to-astro.js <export.xml>

export interface Post {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  categories: string[];
  tags: string[];
}

export const posts: Post[] = ${JSON.stringify(processedPosts, null, 2)};
`;
}

/**
 * Generate pages.ts
 */
function generatePagesTS(pages, attachmentMap) {
  const processedPages = pages.map(page => {
    const thumbnailUrl = page.thumbnailId ? attachmentMap.get(page.thumbnailId) : null;
    const thumbnail = thumbnailUrl
      ? `/images/pages/${sanitizeFilename(basename(new URL(thumbnailUrl).pathname))}`
      : '';

    return {
      slug: page.postName || generateSlug(page.title),
      title: page.title,
      content: page.content,
      excerpt: page.excerpt ? stripHtml(page.excerpt) : generateExcerpt(page.content),
      thumbnail,
      menuOrder: parseInt(page.menuOrder) || 0,
      parent: page.postParent || '',
    };
  });

  // Sort by menu order
  processedPages.sort((a, b) => a.menuOrder - b.menuOrder);

  return `// Auto-generated from WordPress export
// Run: node scripts/wp-to-astro.js <export.xml>

export interface Page {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  menuOrder: number;
  parent: string;
}

export const pages: Page[] = ${JSON.stringify(processedPages, null, 2)};
`;
}

/**
 * Generate categories.ts
 */
function generateCategoriesTS(categories) {
  const processed = categories.map(cat => ({
    slug: cat.slug,
    name: cat.name,
    description: cat.description || '',
    parent: cat.parent || '',
  }));

  return `// Auto-generated from WordPress export
// Run: node scripts/wp-to-astro.js <export.xml>

export interface Category {
  slug: string;
  name: string;
  description: string;
  parent: string;
}

export const categories: Category[] = ${JSON.stringify(processed, null, 2)};
`;
}

/**
 * Generate tags.ts
 */
function generateTagsTS(tags) {
  const processed = tags.map(tag => ({
    slug: tag.slug,
    name: tag.name,
    description: tag.description || '',
  }));

  return `// Auto-generated from WordPress export
// Run: node scripts/wp-to-astro.js <export.xml>

export interface Tag {
  slug: string;
  name: string;
  description: string;
}

export const tags: Tag[] = ${JSON.stringify(processed, null, 2)};
`;
}

/**
 * Generate authors.ts
 */
function generateAuthorsTS(authors) {
  const processed = authors.map(author => ({
    login: author.login,
    displayName: author.displayName || author.login,
    email: author.email || '',
    firstName: author.firstName || '',
    lastName: author.lastName || '',
  }));

  return `// Auto-generated from WordPress export
// Run: node scripts/wp-to-astro.js <export.xml>

export interface Author {
  login: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const authors: Author[] = ${JSON.stringify(processed, null, 2)};
`;
}

/**
 * Sanitize filename for local storage
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('WordPress to Astro Converter');
  console.log('============================\n');

  // Read and parse XML
  console.log(`Reading: ${xmlPath}`);
  const xml = readFileSync(xmlPath, 'utf-8');
  const fileSize = (Buffer.byteLength(xml, 'utf-8') / 1024 / 1024).toFixed(2);
  console.log(`File size: ${fileSize} MB\n`);

  console.log('Parsing WordPress export...');
  const data = parseWXR(xml);

  // Separate items by type
  const posts = data.items.filter(item =>
    item.postType === 'post' && item.status === 'publish'
  );
  const pages = data.items.filter(item =>
    item.postType === 'page' && item.status === 'publish'
  );
  const attachments = data.items.filter(item =>
    item.postType === 'attachment'
  );

  // Build attachment ID -> URL map
  const attachmentMap = new Map();
  for (const att of attachments) {
    if (att.attachmentUrl) {
      attachmentMap.set(att.id, att.attachmentUrl);
    }
  }

  // Print summary
  console.log('\n--- Summary ---');
  console.log(`Site: ${data.siteInfo.title}`);
  console.log(`Authors: ${data.authors.length}`);
  console.log(`Categories: ${data.categories.length}`);
  console.log(`Tags: ${data.tags.length}`);
  console.log(`Posts: ${posts.length}`);
  console.log(`Pages: ${pages.length}`);
  console.log(`Attachments: ${attachments.length}`);

  if (CONFIG.dryRun) {
    console.log('\n[Dry run - no files written]');

    // Show sample data
    if (posts.length > 0) {
      console.log('\nSample post:');
      console.log(`  Title: ${posts[0].title}`);
      console.log(`  Slug: ${posts[0].postName}`);
      console.log(`  Date: ${posts[0].postDate}`);
      console.log(`  Categories: ${posts[0].categories.map(c => c.name).join(', ')}`);
      console.log(`  Tags: ${posts[0].tags.map(t => t.name).join(', ')}`);
    }

    return;
  }

  // Create directories
  console.log('\n--- Creating directories ---');
  const dirs = [
    CONFIG.outputDir,
    join(CONFIG.mediaDir, 'posts'),
    join(CONFIG.mediaDir, 'pages'),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`Created: ${dir}`);
    }
  }

  // Download media
  if (!CONFIG.skipMedia && attachments.length > 0) {
    console.log('\n--- Downloading media ---');

    // Collect all media to download
    const mediaItems = [];

    // Featured images for posts
    for (const post of posts) {
      if (post.thumbnailId && attachmentMap.has(post.thumbnailId)) {
        const url = attachmentMap.get(post.thumbnailId);
        const filename = sanitizeFilename(basename(new URL(url).pathname));
        mediaItems.push({
          url,
          dest: join(CONFIG.mediaDir, 'posts', filename),
        });
      }
    }

    // Featured images for pages
    for (const page of pages) {
      if (page.thumbnailId && attachmentMap.has(page.thumbnailId)) {
        const url = attachmentMap.get(page.thumbnailId);
        const filename = sanitizeFilename(basename(new URL(url).pathname));
        mediaItems.push({
          url,
          dest: join(CONFIG.mediaDir, 'pages', filename),
        });
      }
    }

    // Deduplicate
    const seen = new Set();
    const uniqueMedia = mediaItems.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });

    console.log(`Downloading ${uniqueMedia.length} unique featured images...`);
    const downloadResults = await downloadMediaBatch(uniqueMedia, CONFIG.maxConcurrentDownloads);
    console.log(`  Downloaded: ${downloadResults.success}`);
    console.log(`  Skipped (already exists): ${downloadResults.skipped}`);
    if (downloadResults.failed > 0) {
      console.log(`  Failed: ${downloadResults.failed}`);
      for (const err of downloadResults.errors.slice(0, 5)) {
        console.log(`    - ${err.error}`);
      }
      if (downloadResults.errors.length > 5) {
        console.log(`    ... and ${downloadResults.errors.length - 5} more`);
      }
    }
  }

  // Generate TypeScript files
  console.log('\n--- Generating TypeScript files ---');

  if (posts.length > 0) {
    const postsTS = generatePostsTS(posts, attachmentMap);
    writeFileSync(join(CONFIG.outputDir, 'posts.ts'), postsTS);
    console.log(`Generated: ${CONFIG.outputDir}/posts.ts (${posts.length} posts)`);
  }

  if (pages.length > 0) {
    const pagesTS = generatePagesTS(pages, attachmentMap);
    writeFileSync(join(CONFIG.outputDir, 'pages.ts'), pagesTS);
    console.log(`Generated: ${CONFIG.outputDir}/pages.ts (${pages.length} pages)`);
  }

  if (data.categories.length > 0) {
    const categoriesTS = generateCategoriesTS(data.categories);
    writeFileSync(join(CONFIG.outputDir, 'categories.ts'), categoriesTS);
    console.log(`Generated: ${CONFIG.outputDir}/categories.ts (${data.categories.length} categories)`);
  }

  if (data.tags.length > 0) {
    const tagsTS = generateTagsTS(data.tags);
    writeFileSync(join(CONFIG.outputDir, 'tags.ts'), tagsTS);
    console.log(`Generated: ${CONFIG.outputDir}/tags.ts (${data.tags.length} tags)`);
  }

  if (data.authors.length > 0) {
    const authorsTS = generateAuthorsTS(data.authors);
    writeFileSync(join(CONFIG.outputDir, 'authors.ts'), authorsTS);
    console.log(`Generated: ${CONFIG.outputDir}/authors.ts (${data.authors.length} authors)`);
  }

  // Final instructions
  console.log('\n--- Next steps ---');
  console.log('1. Review generated files in src/data/');
  console.log('2. Update Post/Page interfaces in generated files to match your site\'s needs');
  console.log('3. The "content" field contains raw HTML - convert to markdown if needed');
  console.log('4. Create Astro pages to render the data');
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
