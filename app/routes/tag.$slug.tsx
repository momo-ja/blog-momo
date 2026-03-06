import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { getDB } from "~/lib/db.server";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.tag) {
    return [{ title: "タグが見つかりません - Momo Blog" }];
  }
  return [{ title: `${data.tag.name} - Momo Blog` }];
};

export async function loader({ context, params }: LoaderFunctionArgs) {
  const db = getDB(context.cloudflare.env);
  const tag = await db.getTagBySlug(params.slug!);

  if (!tag) {
    throw new Response("Not Found", { status: 404 });
  }

  const { posts } = await db.getPostsByTag(params.slug!, { limit: 20 });
  const categories = await db.getCategories();
  const tags = await db.getTags();

  return { tag, posts, categories, tags };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default function TagPage() {
  const { tag, posts, categories, tags } = useLoaderData<typeof loader>();

  return (
    <>
      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="header__logo">
            Momo Blog
          </Link>
        </div>
      </header>

      <main className="container">
        <h1 style={{ marginBottom: "32px" }}>タグ: {tag.name}</h1>

        <div className="main-layout">
          <div className="content">
            {posts.length === 0 ? (
              <div className="article">
                <p style={{ textAlign: "center", color: "var(--muted)" }}>
                  このタグの記事はまだありません。
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="post-card">
                  {post.hero_image_url && (
                    <img src={post.hero_image_url} alt={post.title} className="post-card__image" />
                  )}
                  <div className="post-card__content">
                    <p className="post-card__meta">
                      {formatDate(post.published_at)}
                      {post.category && (
                        <>
                          {" • "}
                          <Link to={`/category/${post.category.slug}`}>{post.category.name}</Link>
                        </>
                      )}
                    </p>
                    <h2 className="post-card__title">
                      <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <p className="post-card__excerpt">{post.excerpt}</p>
                  </div>
                </article>
              ))
            )}
          </div>

          <aside className="sidebar">
            <section className="sidebar__section">
              <h3 className="sidebar__title">カテゴリー</h3>
              <ul className="sidebar__list">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link to={`/category/${category.slug}`}>{category.name}</Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="sidebar__section">
              <h3 className="sidebar__title">タグ</h3>
              <ul className="sidebar__list">
                {tags.map((t) => (
                  <li key={t.id}>
                    <Link to={`/tag/${t.slug}`}>{t.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Momo Platform. All rights reserved.</p>
      </footer>
    </>
  );
}
