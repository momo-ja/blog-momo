import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { getDB } from "~/lib/db.server";
import { processAffiliateLinks } from "~/lib/affiliate";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [{ title: "記事が見つかりません - Momo Blog" }];
  }
  return [
    { title: `${data.post.title} - Momo Blog` },
    { name: "description", content: data.post.excerpt },
  ];
};

export async function loader({ context, params }: LoaderFunctionArgs) {
  const db = getDB(context.cloudflare.env);
  const post = await db.getPostBySlug(params.slug!);

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  // Process affiliate links in content
  const affiliateId = context.cloudflare.env.AFFILIATE_ID;
  const processedContent = processAffiliateLinks(post.content, affiliateId);

  const categories = await db.getCategories();
  const tags = await db.getTags();

  return { post: { ...post, processedContent }, categories, tags };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export default function Post() {
  const { post, categories, tags } = useLoaderData<typeof loader>();

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
            <article className="article">
              <header className="article__header">
                <p className="article__meta">
                  {formatDate(post.published_at)}
                  {post.category && (
                    <>
                      {" • "}
                      <Link to={`/category/${post.category.slug}`}>{post.category.name}</Link>
                    </>
                  )}
                </p>
                <h1 className="article__title">{post.title}</h1>
                {post.tags && post.tags.length > 0 && (
                  <div className="article__tags">
                    {post.tags.map((tag) => (
                      <Link key={tag.id} to={`/tag/${tag.slug}`} className="article__tag">
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </header>

              {post.hero_image_url && (
                <img src={post.hero_image_url} alt={post.title} className="article__hero" />
              )}

              <div
                className="article__body"
                dangerouslySetInnerHTML={{ __html: post.processedContent }}
              />
            </article>
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
