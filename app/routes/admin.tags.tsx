import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect, json } from "@remix-run/cloudflare";
import { Form, useLoaderData, Link, useActionData } from "@remix-run/react";
import { getDB } from "~/lib/db.server";

const ADMIN_COOKIE_NAME = "admin_session";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("Cookie");
  const isAuthenticated = cookie?.includes(`${ADMIN_COOKIE_NAME}=authenticated`);

  if (!isAuthenticated) {
    return redirect("/admin");
  }

  const db = getDB(context.cloudflare.env);
  const tags = await db.getTags();

  return { tags };
}

export async function action({ context, request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const db = getDB(context.cloudflare.env);
  const action = formData.get("_action") as string;

  if (action === "delete") {
    const id = parseInt(formData.get("id") as string, 10);
    await db.deleteTag(id);
    return redirect("/admin/tags");
  }

  if (action === "create") {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!name || !slug) {
      return json({ error: "名前とスラッグは必須です" }, { status: 400 });
    }

    try {
      await db.createTag(name, slug);
      return redirect("/admin/tags");
    } catch (error) {
      return json({ error: "タグの作成に失敗しました" }, { status: 500 });
    }
  }

  return null;
}

export default function AdminTags() {
  const { tags } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">Momo Blog 管理画面</div>
        <nav>
          <ul className="admin-sidebar__nav">
            <li><Link to="/admin">ダッシュボード</Link></li>
            <li><Link to="/admin/posts">記事管理</Link></li>
            <li><Link to="/admin/posts/new">新規記事</Link></li>
            <li><Link to="/admin/categories">カテゴリー</Link></li>
            <li><Link to="/admin/tags" className="active">タグ</Link></li>
            <li><a href="/">サイトを表示</a></li>
          </ul>
        </nav>
      </aside>

      <main className="admin-content">
        <div className="admin-header">
          <h1>タグ管理</h1>
        </div>

        <div className="admin-form" style={{ marginBottom: "32px" }}>
          <h3 style={{ marginBottom: "20px" }}>新規タグ</h3>
          {actionData?.error && (
            <p style={{ color: "red", marginBottom: "16px" }}>{actionData.error}</p>
          )}
          <Form method="post" style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="name">名前</label>
              <input type="text" name="name" id="name" required />
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="slug">スラッグ</label>
              <input type="text" name="slug" id="slug" required placeholder="tag-slug" />
            </div>
            <button type="submit" name="_action" value="create" className="btn">追加</button>
          </Form>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名前</th>
              <th>スラッグ</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td>{tag.id}</td>
                <td>{tag.name}</td>
                <td><code>{tag.slug}</code></td>
                <td>
                  <Form method="post" style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={tag.id} />
                    <button type="submit" name="_action" value="delete" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                      削除
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
