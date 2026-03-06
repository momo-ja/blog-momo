import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect, json } from "@remix-run/cloudflare";
import { Form, useLoaderData, Link } from "@remix-run/react";
import { getDB } from "~/lib/db.server";

const ADMIN_COOKIE_NAME = "admin_session";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("Cookie");
  const isAuthenticated = cookie?.includes(`${ADMIN_COOKIE_NAME}=authenticated`);

  if (!isAuthenticated) {
    return redirect("/admin");
  }

  const db = getDB(context.cloudflare.env);
  const categories = await db.getCategories();
  const tags = await db.getTags();

  return { categories, tags };
}

export async function action({ context, request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const db = getDB(context.cloudflare.env);

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const excerpt = formData.get("excerpt") as string;
  const content = formData.get("content") as string;
  const heroImageUrl = formData.get("hero_image_url") as string;
  const categoryId = formData.get("category_id") as string;
  const isPublished = formData.get("is_published") === "on";
  const tagIds = formData.getAll("tag_ids").map((id) => parseInt(id as string, 10)).filter(Boolean);

  // Validation
  if (!title || !slug || !content) {
    return json({ error: "タイトル、スラッグ、本文は必須です" }, { status: 400 });
  }

  try {
    await db.createPost({
      title,
      slug,
      excerpt: excerpt || "",
      content,
      hero_image_url: heroImageUrl || undefined,
      category_id: categoryId ? parseInt(categoryId, 10) : undefined,
      is_published: isPublished,
      tag_ids: tagIds.length > 0 ? tagIds : undefined,
    });

    return redirect("/admin/posts");
  } catch (error) {
    return json({ error: "記事の作成に失敗しました" }, { status: 500 });
  }
}

export default function NewPost() {
  const { categories, tags } = useLoaderData<typeof loader>();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">Momo Blog 管理画面</div>
        <nav>
          <ul className="admin-sidebar__nav">
            <li><Link to="/admin">ダッシュボード</Link></li>
            <li><Link to="/admin/posts">記事管理</Link></li>
            <li><Link to="/admin/posts/new" className="active">新規記事</Link></li>
            <li><Link to="/admin/categories">カテゴリー</Link></li>
            <li><Link to="/admin/tags">タグ</Link></li>
            <li><a href="/">サイトを表示</a></li>
          </ul>
        </nav>
      </aside>

      <main className="admin-content">
        <div className="admin-header">
          <h1>新規記事作成</h1>
        </div>

        <Form method="post" className="admin-form">
          <div className="form-group">
            <label htmlFor="title">タイトル *</label>
            <input type="text" name="title" id="title" required />
          </div>

          <div className="form-group">
            <label htmlFor="slug">スラッグ * (URL用識別子)</label>
            <input type="text" name="slug" id="slug" required placeholder="my-first-post" />
          </div>

          <div className="form-group">
            <label htmlFor="excerpt">抜粋</label>
            <textarea name="excerpt" id="excerpt" rows={3} placeholder="記事の簡潔な説明" />
          </div>

          <div className="form-group">
            <label htmlFor="hero_image_url">ヒーロー画像URL</label>
            <input type="url" name="hero_image_url" id="hero_image_url" placeholder="https://..." />
          </div>

          <div className="form-group">
            <label htmlFor="category_id">カテゴリー</label>
            <select name="category_id" id="category_id">
              <option value="">選択してください</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content">本文 *</label>
            <textarea name="content" id="content" rows={15} required placeholder="記事の本文を入力してください。&#10;&#10;アフィリエイトリンクの埋め込み:&#10;[affiliate:商品名:https://amazon.co.jp/dp/xxx:商品の説明]" />
            <small style={{ color: "var(--muted)", display: "block", marginTop: "8px" }}>
              アフィリエイト埋め込み: <code>[affiliate:商品名:URL:説明]</code>
            </small>
          </div>

          <div className="form-group">
            <label>タグ</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "8px" }}>
              {tags.map((tag) => (
                <label key={tag.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input type="checkbox" name="tag_ids" value={tag.id} />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" name="is_published" defaultChecked />
              公開する
            </label>
          </div>

          <div className="admin-form__actions">
            <button type="submit" className="btn">作成</button>
            <Link to="/admin/posts" className="btn btn-secondary">キャンセル</Link>
          </div>
        </Form>
      </main>
    </div>
  );
}
