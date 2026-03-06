import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
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
  const { posts, total } = await db.getPosts({ limit: 100 });

  return { posts, total };
}

export async function action({ context, request }: ActionFunctionArgs) {
  const cookie = request.headers.get("Cookie");
  const isAuthenticated = cookie?.includes(`${ADMIN_COOKIE_NAME}=authenticated`);

  if (!isAuthenticated) {
    return redirect("/admin");
  }

  const formData = await request.formData();
  const postId = parseInt(formData.get("post_id") as string, 10);
  const action = formData.get("_action") as string;

  if (action === "delete" && postId) {
    const db = getDB(context.cloudflare.env);
    await db.deletePost(postId);
  }

  return redirect("/admin/posts");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminPosts() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">Momo Blog 管理画面</div>
        <nav>
          <ul className="admin-sidebar__nav">
            <li><Link to="/admin">ダッシュボード</Link></li>
            <li><Link to="/admin/posts" className="active">記事管理</Link></li>
            <li><Link to="/admin/posts/new">新規記事</Link></li>
            <li><Link to="/admin/categories">カテゴリー</Link></li>
            <li><Link to="/admin/tags">タグ</Link></li>
            <li><a href="/">サイトを表示</a></li>
          </ul>
        </nav>
      </aside>

      <main className="admin-content">
        <div className="admin-header">
          <h1>記事管理</h1>
          <Link to="/admin/posts/new" className="btn">新規記事作成</Link>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>タイトル</th>
              <th>カテゴリー</th>
              <th>ステータス</th>
              <th>公開日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.category?.name || "-"}</td>
                <td>{post.is_published ? "公開" : "下書き"}</td>
                <td>{formatDate(post.published_at)}</td>
                <td>
                  <div className="admin-actions">
                    <Link to={`/admin/posts/${post.id}`}>編集</Link>
                    <a href={`/posts/${post.slug}`} target="_blank" rel="noreferrer">表示</a>
                    <Form method="post" style={{ display: "inline" }} onSubmit={(e) => {
                      if (!confirm("この記事を削除しますか？")) {
                        e.preventDefault();
                      }
                    }}>
                      <input type="hidden" name="post_id" value={post.id} />
                      <input type="hidden" name="_action" value="delete" />
                      <button type="submit" className="btn-link" style={{ color: "#c00" }}>削除</button>
                    </Form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <style>{`
        .btn-link {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: inherit;
          text-decoration: underline;
        }
        .btn-link:hover {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
