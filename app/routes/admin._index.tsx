import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect, json } from "@remix-run/cloudflare";
import { Form, useActionData, useLoaderData, Link } from "@remix-run/react";
import { getDB } from "~/lib/db.server";
import { createCookie } from "@remix-run/cloudflare";

const ADMIN_COOKIE_NAME = "admin_session";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("Cookie");
  const isAuthenticated = cookie?.includes(`${ADMIN_COOKIE_NAME}=authenticated`);

  if (isAuthenticated) {
    const db = getDB(context.cloudflare.env);
    const { posts } = await db.getPosts({ limit: 5 });
    const categories = await db.getCategories();
    const tags = await db.getTags();

    return { authenticated: true, posts, categories, tags };
  }

  return { authenticated: false, posts: [], categories: [], tags: [] };
}

export async function action({ context, request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const action = formData.get("_action") as string;

  // Logout
  if (action === "logout") {
    return redirect("/admin", {
      headers: {
        "Set-Cookie": `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`,
      },
    });
  }

  // Login
  const adminPassword = context.cloudflare.env.ADMIN_PASSWORD || "momo-admin-2026";

  if (password === adminPassword) {
    return redirect("/admin", {
      headers: {
        "Set-Cookie": `${ADMIN_COOKIE_NAME}=authenticated; Path=/; HttpOnly; Max-Age=86400`,
      },
    });
  }

  return json({ error: "パスワードが正しくありません" }, { status: 401 });
}

export default function Admin() {
  const { authenticated, posts, categories, tags } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!authenticated) {
    return (
      <div className="admin-login">
        <h1>管理画面ログイン</h1>
        <Form method="post">
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input type="password" name="password" id="password" required autoFocus />
          </div>
          {actionData?.error && (
            <p style={{ color: "red", marginBottom: "16px" }}>{actionData.error}</p>
          )}
          <button type="submit" className="btn" style={{ width: "100%" }}>
            ログイン
          </button>
        </Form>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">Momo Blog 管理画面</div>
        <nav>
          <ul className="admin-sidebar__nav">
            <li>
              <Link to="/admin" className="active">
                ダッシュボード
              </Link>
            </li>
            <li>
              <Link to="/admin/posts">記事管理</Link>
            </li>
            <li>
              <Link to="/admin/posts/new">新規記事</Link>
            </li>
            <li>
              <Link to="/admin/categories">カテゴリー</Link>
            </li>
            <li>
              <Link to="/admin/tags">タグ</Link>
            </li>
            <li>
              <a href="/">サイトを表示</a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="admin-content">
        <div className="admin-header">
          <h1>ダッシュボード</h1>
          <Form method="post" style={{ display: "inline" }}>
            <input type="hidden" name="_action" value="logout" />
            <button type="submit" className="btn btn-secondary">
              ログアウト
            </button>
          </Form>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
          <div className="sidebar__section">
            <h3 style={{ marginBottom: "8px" }}>記事</h3>
            <p style={{ fontSize: "2rem", fontWeight: "600" }}>{posts.length}</p>
          </div>
          <div className="sidebar__section">
            <h3 style={{ marginBottom: "8px" }}>カテゴリー</h3>
            <p style={{ fontSize: "2rem", fontWeight: "600" }}>{categories.length}</p>
          </div>
          <div className="sidebar__section">
            <h3 style={{ marginBottom: "8px" }}>タグ</h3>
            <p style={{ fontSize: "2rem", fontWeight: "600" }}>{tags.length}</p>
          </div>
        </div>

        <h2 style={{ marginBottom: "20px" }}>最新記事</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>タイトル</th>
              <th>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.is_published ? "公開" : "下書き"}</td>
                <td>
                  <div className="admin-actions">
                    <Link to={`/admin/posts/${post.id}`}>編集</Link>
                    <a href={`/posts/${post.slug}`} target="_blank" rel="noreferrer">
                      表示
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
