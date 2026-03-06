import type { CloudflareEnv } from "~/env.d.ts";

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  hero_image_url: string | null;
  category_id: number | null;
  category?: Category;
  published_at: string;
  updated_at: string;
  is_published: number;
  tags?: Tag[];
}

export interface PostTag {
  post_id: number;
  tag_id: number;
}

export interface MediaAsset {
  id: number;
  key: string;
  url: string;
  alt_text: string | null;
  created_at: string;
}

export class DB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const result = await this.db.prepare("SELECT * FROM categories ORDER BY name").all<Category>();
    return result.results;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return await this.db.prepare("SELECT * FROM categories WHERE slug = ?").bind(slug).first<Category>();
  }

  async createCategory(name: string, slug: string): Promise<Category> {
    const result = await this.db
      .prepare("INSERT INTO categories (name, slug) VALUES (?, ?) RETURNING *")
      .bind(name, slug)
      .first<Category>();
    return result!;
  }

  async updateCategory(id: number, name: string, slug: string): Promise<void> {
    await this.db.prepare("UPDATE categories SET name = ?, slug = ? WHERE id = ?").bind(name, slug, id).run();
  }

  async deleteCategory(id: number): Promise<void> {
    await this.db.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    const result = await this.db.prepare("SELECT * FROM tags ORDER BY name").all<Tag>();
    return result.results;
  }

  async getTagBySlug(slug: string): Promise<Tag | null> {
    return await this.db.prepare("SELECT * FROM tags WHERE slug = ?").bind(slug).first<Tag>();
  }

  async createTag(name: string, slug: string): Promise<Tag> {
    const result = await this.db
      .prepare("INSERT INTO tags (name, slug) VALUES (?, ?) RETURNING *")
      .bind(name, slug)
      .first<Tag>();
    return result!;
  }

  async updateTag(id: number, name: string, slug: string): Promise<void> {
    await this.db.prepare("UPDATE tags SET name = ?, slug = ? WHERE id = ?").bind(name, slug, id).run();
  }

  async deleteTag(id: number): Promise<void> {
    await this.db.prepare("DELETE FROM tags WHERE id = ?").bind(id).run();
  }

  // Posts
  async getPosts(options: { page?: number; limit?: number; published?: boolean } = {}): Promise<{ posts: Post[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause = "";
    const params: (number | string)[] = [];

    if (options.published) {
      whereClause = "WHERE p.is_published = 1";
    }

    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM posts p ${whereClause}`)
      .first<{ count: number }>();
    const total = countResult?.count || 0;

    const postsResult = await this.db
      .prepare(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM posts p
         LEFT JOIN categories c ON p.category_id = c.id
         ${whereClause}
         ORDER BY p.published_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all<Post & { category_name: string | null; category_slug: string | null }>();

    const posts = postsResult.results.map((p) => ({
      ...p,
      category: p.category_id && p.category_name ? { id: p.category_id, name: p.category_name, slug: p.category_slug! } : undefined,
    }));

    // Get tags for each post
    for (const post of posts) {
      const tagsResult = await this.db
        .prepare(
          `SELECT t.* FROM tags t
           JOIN post_tags pt ON t.id = pt.tag_id
           WHERE pt.post_id = ?`
        )
        .bind(post.id)
        .all<Tag>();
      post.tags = tagsResult.results;
    }

    return { posts, total };
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const post = await this.db
      .prepare(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM posts p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ?`
      )
      .bind(slug)
      .first<Post & { category_name: string | null; category_slug: string | null }>();

    if (!post) return null;

    if (post.category_id && post.category_name) {
      post.category = { id: post.category_id, name: post.category_name, slug: post.category_slug! };
    }

    const tagsResult = await this.db
      .prepare(
        `SELECT t.* FROM tags t
         JOIN post_tags pt ON t.id = pt.tag_id
         WHERE pt.post_id = ?`
      )
      .bind(post.id)
      .all<Tag>();
    post.tags = tagsResult.results;

    return post;
  }

  async getPostsByCategory(categorySlug: string, options: { page?: number; limit?: number } = {}): Promise<{ posts: Post[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const countResult = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM posts p
         JOIN categories c ON p.category_id = c.id
         WHERE c.slug = ? AND p.is_published = 1`
      )
      .bind(categorySlug)
      .first<{ count: number }>();
    const total = countResult?.count || 0;

    const postsResult = await this.db
      .prepare(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM posts p
         JOIN categories c ON p.category_id = c.id
         WHERE c.slug = ? AND p.is_published = 1
         ORDER BY p.published_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(categorySlug, limit, offset)
      .all<Post & { category_name: string; category_slug: string }>();

    const posts = postsResult.results.map((p) => ({
      ...p,
      category: { id: p.category_id!, name: p.category_name, slug: p.category_slug },
    }));

    for (const post of posts) {
      const tagsResult = await this.db
        .prepare(
          `SELECT t.* FROM tags t
           JOIN post_tags pt ON t.id = pt.tag_id
           WHERE pt.post_id = ?`
        )
        .bind(post.id)
        .all<Tag>();
      post.tags = tagsResult.results;
    }

    return { posts, total };
  }

  async getPostsByTag(tagSlug: string, options: { page?: number; limit?: number } = {}): Promise<{ posts: Post[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const countResult = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM posts p
         JOIN post_tags pt ON p.id = pt.post_id
         JOIN tags t ON pt.tag_id = t.id
         WHERE t.slug = ? AND p.is_published = 1`
      )
      .bind(tagSlug)
      .first<{ count: number }>();
    const total = countResult?.count || 0;

    const postsResult = await this.db
      .prepare(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM posts p
         LEFT JOIN categories c ON p.category_id = c.id
         JOIN post_tags pt ON p.id = pt.post_id
         JOIN tags t ON pt.tag_id = t.id
         WHERE t.slug = ? AND p.is_published = 1
         ORDER BY p.published_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(tagSlug, limit, offset)
      .all<Post & { category_name: string | null; category_slug: string | null }>();

    const posts = postsResult.results.map((p) => ({
      ...p,
      category: p.category_id && p.category_name ? { id: p.category_id, name: p.category_name, slug: p.category_slug! } : undefined,
    }));

    for (const post of posts) {
      const tagsResult = await this.db
        .prepare(
          `SELECT t.* FROM tags t
           JOIN post_tags pt ON t.id = pt.tag_id
           WHERE pt.post_id = ?`
        )
        .bind(post.id)
        .all<Tag>();
      post.tags = tagsResult.results;
    }

    return { posts, total };
  }

  async createPost(data: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    hero_image_url?: string;
    category_id?: number;
    is_published: boolean;
    tag_ids?: number[];
  }): Promise<Post> {
    const publishedAt = new Date().toISOString();
    const result = await this.db
      .prepare(
        `INSERT INTO posts (title, slug, excerpt, content, hero_image_url, category_id, published_at, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`
      )
      .bind(data.title, data.slug, data.excerpt, data.content, data.hero_image_url || null, data.category_id || null, publishedAt, data.is_published ? 1 : 0)
      .first<Post>();

    if (data.tag_ids && data.tag_ids.length > 0 && result) {
      for (const tagId of data.tag_ids) {
        await this.db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)").bind(result.id, tagId).run();
      }
    }

    return result!;
  }

  async updatePost(
    id: number,
    data: {
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      hero_image_url?: string;
      category_id?: number;
      is_published: boolean;
      tag_ids?: number[];
    }
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE posts
         SET title = ?, slug = ?, excerpt = ?, content = ?, hero_image_url = ?, category_id = ?, is_published = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .bind(data.title, data.slug, data.excerpt, data.content, data.hero_image_url || null, data.category_id || null, data.is_published ? 1 : 0, id)
      .run();

    // Update tags
    await this.db.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(id).run();
    if (data.tag_ids && data.tag_ids.length > 0) {
      for (const tagId of data.tag_ids) {
        await this.db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)").bind(id, tagId).run();
      }
    }
  }

  async deletePost(id: number): Promise<void> {
    await this.db.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(id).run();
    await this.db.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  }

  // Media Assets
  async getMediaAssets(): Promise<MediaAsset[]> {
    const result = await this.db.prepare("SELECT * FROM media_assets ORDER BY created_at DESC").all<MediaAsset>();
    return result.results;
  }

  async createMediaAsset(key: string, url: string, altText?: string): Promise<MediaAsset> {
    const result = await this.db
      .prepare("INSERT INTO media_assets (key, url, alt_text) VALUES (?, ?, ?) RETURNING *")
      .bind(key, url, altText || null)
      .first<MediaAsset>();
    return result!;
  }

  async deleteMediaAsset(key: string): Promise<void> {
    await this.db.prepare("DELETE FROM media_assets WHERE key = ?").bind(key).run();
  }
}

export function getDB(env: CloudflareEnv): DB {
  return new DB(env.DB);
}
