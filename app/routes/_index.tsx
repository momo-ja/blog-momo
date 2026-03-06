import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getDB } from "~/lib/db.server";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Momo Blog - 日々の小さな発見" },
    { name: "description", content: "日常の小さな発見、読書、暮らしについて綴るブログ" },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const db = getDB(context.cloudflare.env);
  const { posts } = await db.getPosts({ published: true, limit: 10 });
  const categories = await db.getCategories();
  const tags = await db.getTags();

  return { posts, categories, tags };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default function Index() {
  const { posts, categories, tags } = useLoaderData<typeof loader>();

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
        <div className="main-layout">
          <div className="content">
            {posts.length === 0 ? (
              <div className="article">
                <p style={{ textAlign: "center", color: "var(--muted)" }}>
                  まだ記事がありません。
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
                {tags.map((tag) => (
                  <li key={tag.id}>
                    <Link to={`/tag/${tag.slug}`}>{tag.name}</Link>
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
