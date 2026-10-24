import { redirect } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import Link from "next/link";
import { HistoryPanel } from "@/components/history-panel";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const auth = await getAuthenticatedUser();
  if (!auth.configured) return <main className="history-shell"><div className="history-topline"><Link className="back-link" href="/"><ArrowLeft size={14} /> Trang chủ</Link><div className="display-controls"><ThemeToggle /></div></div><div className="history-head"><div><div className="section-kicker">LỊCH SỬ RIÊNG TƯ</div><h1>Lịch sử phân tích</h1></div></div><div className="history-empty">Chưa cấu hình Supabase. Hãy hoàn tất hướng dẫn trong README tiếng Việt.</div></main>;
  if (!auth.user || !auth.client) redirect("/auth/login?next=%2Fhistory");
  const { data, error } = await auth.client.from("analysis_reports").select("id,input_type,risk_level,title,created_at").order("created_at", { ascending: false }).range(0, 19);
  return <main className="history-shell"><div className="history-topline"><Link className="back-link" href="/"><ArrowLeft size={14} /> Trở lại phân tích</Link><div className="display-controls"><ThemeToggle /></div></div><div className="history-head"><div><div className="section-kicker">LỊCH SỬ RIÊNG TƯ</div><h1>Lịch sử phân tích</h1><p>Các báo cáo bạn chọn lưu, chỉ hiển thị cho {auth.user.email}.</p></div><span className="side-icon"><Clock3 size={18} /></span></div>{error ? <div className="history-message">Không tải được dữ liệu. Kiểm tra migration và chính sách RLS Supabase.</div> : <HistoryPanel key={auth.user.id} reports={data ?? []} />}</main>;
}
