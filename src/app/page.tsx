"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Panel = "overview" | "videos" | "campaigns" | "analytics" | "captions" | "qr" | "reports" | "settings" | "help";
type Video = {
  id: string; canonicalUrl: string; title: string | null; creatorHandle: string | null; createdAt: string;
  campaigns?: { campaign: { id: string; name: string } }[];
  metrics?: { views: number | null; likes: number | null; comments: number | null; shares: number | null; engagementRate: number | null; capturedAt: string }[];
};
type Campaign = { id: string; name: string; description: string | null; status: string; startsAt: string | null; endsAt: string | null; createdAt: string; _count?: { videos: number }; videos?: { videoId: string }[] };
type Activity = { id: string; action: string; metadata: unknown; createdAt: string };
type Notice = { kind: "error" | "success" | "info"; message: string };

const nav: { id: Panel; label: string; glyph: string }[] = [
  { id: "overview", label: "Overview", glyph: "⌂" }, { id: "videos", label: "Video library", glyph: "▷" },
  { id: "campaigns", label: "Campaigns", glyph: "◫" }, { id: "analytics", label: "Analytics", glyph: "⌁" },
  { id: "captions", label: "Caption studio", glyph: "✳" }, { id: "qr", label: "QR codes", glyph: "▦" },
  { id: "reports", label: "Reports", glyph: "▤" }, { id: "settings", label: "Settings", glyph: "⚙" }, { id: "help", label: "Help & access", glyph: "?" },
];
const titles: Record<Panel, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "YOUR WORKSPACE", title: "Campaign overview", description: "A clear view of what you’re organizing and what data is available." },
  videos: { eyebrow: "CONTENT LIBRARY", title: "Video analyzer", description: "Save TikTok links and view public metadata when it is available." },
  campaigns: { eyebrow: "PROMOTION WORKSPACE", title: "Campaign manager", description: "Keep your video promotions organized, with ownership scoped to your account." },
  analytics: { eyebrow: "PERFORMANCE", title: "Analytics", description: "Only metrics supplied by an authorized source appear here." },
  captions: { eyebrow: "CREATIVE TOOLS", title: "Caption studio", description: "Draft promotional copy and hashtags. Nothing is posted automatically." },
  qr: { eyebrow: "SHARING TOOLS", title: "QR code maker", description: "Create downloadable QR codes for valid TikTok video links." },
  reports: { eyebrow: "EXPORT CENTER", title: "Reports", description: "Download the records currently available in your workspace." },
  settings: { eyebrow: "PREFERENCES", title: "Workspace settings", description: "Account access and data availability information." },
  help: { eyebrow: "GUIDANCE", title: "Help & access", description: "What CART3R can access today—and what requires approval." },
};
function formatDate(value: string | null | undefined) { if (!value) return "Not scheduled"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Not scheduled" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date); }
function csvCell(value: unknown) { let text = value == null ? "" : String(value); if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; }

export default function Home() {
  const [panel, setPanel] = useState<Panel>("overview");
  const [videos, setVideos] = useState<Video[]>([]); const [campaigns, setCampaigns] = useState<Campaign[]>([]); const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true); const [notice, setNotice] = useState<Notice | null>(null);
  const [mobileNav, setMobileNav] = useState(false); const [search, setSearch] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setNotice(null);
    try {
      const [videoRes, campaignRes, activityRes] = await Promise.all([fetch("/api/videos", { cache: "no-store" }), fetch("/api/campaigns", { cache: "no-store" }), fetch("/api/activity", { cache: "no-store" })]);
      if ([videoRes, campaignRes, activityRes].some((response) => response.status === 401)) { setVideos([]); setCampaigns([]); setActivities([]); setNotice({ kind: "info", message: "Sign in to load your private video, campaign and activity records." }); return; }
      if (!videoRes.ok || !campaignRes.ok || !activityRes.ok) throw new Error("We couldn’t load your workspace. Check the server configuration and try again.");
      const [videoJson, campaignJson, activityJson] = await Promise.all([videoRes.json(), campaignRes.json(), activityRes.json()]); setVideos(videoJson.videos ?? []); setCampaigns(campaignJson.campaigns ?? []); setActivities(activityJson.activities ?? []);
    } catch (error) { setNotice({ kind: "error", message: error instanceof Error ? error.message : "Unable to reach the CART3R service." }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
  const searchableVideos = useMemo(() => videos.filter((v) => `${v.title ?? ""} ${v.creatorHandle ?? ""} ${v.canonicalUrl}`.toLowerCase().includes(search.toLowerCase())), [videos, search]);
  const metricSnapshots = videos.flatMap((video) => video.metrics ?? []);
  const availableViews = metricSnapshots.filter((m) => typeof m.views === "number").reduce((sum, m) => sum + (m.views ?? 0), 0);
  const hasViews = metricSnapshots.some((m) => typeof m.views === "number");
  const engagementValues = metricSnapshots.map((m) => m.engagementRate).filter((v): v is number => typeof v === "number");
  const averageEngagement = engagementValues.length ? engagementValues.reduce((a, b) => a + b, 0) / engagementValues.length : null;
  function choosePanel(next: Panel) { setPanel(next); setNotice(null); setMobileNav(false); }
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <a className="brand" href="#overview" onClick={(e) => { e.preventDefault(); choosePanel("overview"); }} aria-label="CART3R dashboard"><span className="brand-mark"><span /></span><span className="brand-word">CART3R<span className="brand-dot">.</span><small>TIKTOK BOOST</small></span></a>
      <div className="workspace-label">WORKSPACE <span className="workspace-chip">BETA</span></div>
      <nav className="side-nav" aria-label="Main navigation">{nav.map((item) => <button key={item.id} className={`nav-item ${panel === item.id ? "active" : ""}`} onClick={() => choosePanel(item.id)}><span className="nav-glyph">{item.glyph}</span><span>{item.label}</span>{item.id === "campaigns" && campaigns.length > 0 && <span className="nav-count">{campaigns.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="side-status"><span className="status-dot" />{loading ? "Syncing workspace" : notice?.kind === "error" ? "Service unavailable" : "Workspace ready"}</div><a href="/login" className="profile-row"><span className="avatar">C</span><span><b>Your account</b><small>Sign in for your data</small></span><span className="profile-arrow">↗</span></a><div className="sidebar-foot">Built for authentic promotion.<br /><span>NO BOTS. NO FAKE ENGAGEMENT.</span></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav((open) => !open)} aria-label="Toggle navigation">☰</button><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{titles[panel].title}</strong></div><div className="topbar-actions"><label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search saved videos" placeholder="Search videos" /></label><a className="button button-quiet top-login" href="/login">Sign in <span>↗</span></a><button className="avatar avatar-top" aria-label="Account menu" onClick={() => setNotice({ kind: "info", message: "Sign in to access your private CART3R workspace." })}>C</button></div></header>
      <section className="content-wrap">
        <div className="page-heading"><div><div className="eyebrow"><i />{titles[panel].eyebrow}</div><h1>{titles[panel].title}</h1><p>{titles[panel].description}</p></div><div className="heading-actions"><button className="button button-quiet" onClick={() => void refresh()} disabled={loading}><span className={loading ? "spin" : ""}>↻</span> Refresh</button><button className="button button-primary" onClick={() => choosePanel("videos")}><span>＋</span> Analyze video</button></div></div>
        {notice && <div className={`notice notice-${notice.kind}`} role="status"><span>{notice.kind === "error" ? "!" : notice.kind === "success" ? "✓" : "i"}</span><p>{notice.message}</p>{notice.kind === "info" && <a href="/login">Sign in <b>→</b></a>}<button className="notice-close" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div>}
        {panel === "overview" && <Overview videos={videos} campaigns={campaigns} activities={activities} loading={loading} hasViews={hasViews} views={availableViews} engagement={averageEngagement} onNavigate={choosePanel} />}
        {panel === "videos" && <VideosPanel videos={searchableVideos} loading={loading} onRefresh={refresh} onNotice={setNotice} />}
        {panel === "campaigns" && <CampaignsPanel campaigns={campaigns} videos={videos} loading={loading} onRefresh={refresh} onNotice={setNotice} />}
        {panel === "analytics" && <AnalyticsPanel videos={videos} loading={loading} onNavigate={choosePanel} />}
        {panel === "captions" && <CaptionsPanel onNotice={setNotice} />}
        {panel === "qr" && <QrPanel onNotice={setNotice} />}
        {panel === "reports" && <ReportsPanel videos={videos} campaigns={campaigns} onNotice={setNotice} />}
        {panel === "settings" && <SettingsPanel />}{panel === "help" && <HelpPanel />}
        <footer className="page-footer"><span>© {new Date().getFullYear()} CART3R</span><span>Metrics are shown only when an authorized source provides them.</span><button onClick={() => choosePanel("help")}>Data access & privacy</button></footer>
      </section>
    </main>
  </div>;
}

function MetricCard({ label, value, note, icon, tone }: { label: string; value: string; note: string; icon: string; tone?: string }) { return <article className="metric-card"><div className="metric-top"><span>{label}</span><i className={tone ? `metric-icon ${tone}` : "metric-icon"}>{icon}</i></div><strong>{value}</strong><small>{note}</small><span className="metric-rule" /></article>; }

function Overview({ videos, campaigns, activities, loading, hasViews, views, engagement, onNavigate }: { videos: Video[]; campaigns: Campaign[]; activities: Activity[]; loading: boolean; hasViews: boolean; views: number; engagement: number | null; onNavigate: (panel: Panel) => void }) {
  const active = campaigns.filter((campaign) => campaign.status === "ACTIVE");
  const recentVideos = [...videos].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4);
  const chartVideos = videos.map((video) => ({ video, views: video.metrics?.[0]?.views })).filter((entry): entry is { video: Video; views: number } => typeof entry.views === "number").slice(0, 12);
  const maxViews = Math.max(1, ...chartVideos.map((entry) => entry.views));
  return <>
    <div className="metrics-grid"><MetricCard label="TRACKED VIDEOS" value={loading ? "…" : String(videos.length)} note="Saved in your library" icon="▷" tone="red" /><MetricCard label="ACTIVE CAMPAIGNS" value={loading ? "…" : String(active.length)} note="Currently in progress" icon="◫" /><MetricCard label="AVAILABLE VIEWS" value={hasViews ? views.toLocaleString() : "—"} note={hasViews ? "Latest available snapshots" : "No authorized metric source yet"} icon="◉" /><MetricCard label="ENGAGEMENT RATE" value={engagement === null ? "—" : engagement.toFixed(2)} note={engagement === null ? "Unavailable until an authorized source provides it" : "Average of available snapshots"} icon="⌁" /></div>
    <div className="section-grid overview-grid"><section className="surface performance-card"><div className="section-title"><div><span className="eyebrow">PERFORMANCE SNAPSHOT</span><h2>Available views by video</h2></div><button className="text-button" onClick={() => onNavigate("analytics")}>View analytics <span>→</span></button></div>
      {chartVideos.length ? <div className="chart-area"><div className="chart-summary"><strong>{views.toLocaleString()}</strong><span>sum of available latest snapshots</span></div><div className="chart-bars" aria-label="Latest available views per video">{chartVideos.map(({ video, views: count }) => <div className="chart-bar-wrap" key={video.id} title={`${video.title || "TikTok video"}: ${count.toLocaleString()} views`}><i style={{ height: `${Math.max(8, count / maxViews * 100)}%` }} /><small>{video.creatorHandle ? `@${video.creatorHandle.slice(0, 8)}` : "Video"}</small></div>)}</div><div className="chart-foot"><span>PER VIDEO SNAPSHOTS</span><span>Not a time-series trend</span></div></div> : <div className="empty-graph"><span className="empty-graph-icon">⌁</span><strong>Performance data will appear here</strong><p>Connect an approved analytics source or add authorized snapshots to see metrics.</p><button className="button button-quiet" onClick={() => onNavigate("help")}>See data access requirements</button></div>}</section>
      <section className="surface campaign-overview"><div className="section-title"><div><span className="eyebrow">CAMPAIGN TRACKER</span><h2>Campaigns</h2></div><button className="icon-button" aria-label="View campaigns" onClick={() => onNavigate("campaigns")}>↗</button></div>
        {campaigns.length ? <div className="campaign-mini-list">{campaigns.slice(0, 4).map((campaign) => <div className="campaign-mini" key={campaign.id}><span className="campaign-mark">{campaign.name.slice(0, 1).toUpperCase()}</span><div className="campaign-mini-copy"><b>{campaign.name}</b><small>{campaign._count?.videos ?? 0} videos · {formatDate(campaign.startsAt)}</small></div><span className={`pill pill-${campaign.status.toLowerCase()}`}>{campaign.status}</span></div>)}</div> : <div className="empty-small"><div className="empty-icon">◫</div><strong>No campaigns yet</strong><p>Group video links into a focused promotion.</p><button className="button button-primary button-small" onClick={() => onNavigate("campaigns")}>Create a campaign <span>→</span></button></div>}
      </section></div>
    <section className="surface activity-card"><div className="section-title"><div><span className="eyebrow">ACCOUNT ACTIVITY</span><h2>Recent activity</h2></div><span className="pill pill-neutral">LATEST</span></div>{activities.length ? <div className="activity-list">{activities.slice(0, 6).map((activity) => <div className="activity-row" key={activity.id}><span className="activity-pip">{activity.action.startsWith("campaign") ? "◫" : activity.action === "video.analyze" ? "▷" : "•"}</span><div><b>{activity.action === "campaign.create" ? "Campaign created" : activity.action === "campaign.update" ? "Campaign updated" : activity.action === "campaign.delete" ? "Campaign deleted" : activity.action === "video.analyze" ? "Video analyzed" : activity.action === "user.register" ? "Account created" : "Workspace activity"}</b><small>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.createdAt))}</small></div></div>)}</div> : <div className="empty-inline"><span className="empty-icon">◷</span><div><b>{loading ? "Loading activity…" : "No recent activity"}</b><p>Your account actions will appear here when you’re signed in.</p></div></div>}</section>
    <section className="surface recent-surface"><div className="section-title"><div><span className="eyebrow">LIBRARY</span><h2>Recently analyzed videos</h2></div><button className="text-button" onClick={() => onNavigate("videos")}>Open library <span>→</span></button></div>
      {recentVideos.length ? <div className="table-scroll"><table><thead><tr><th>VIDEO</th><th>CREATOR</th><th>CAMPAIGNS</th><th>ADDED</th><th /></tr></thead><tbody>{recentVideos.map((video) => <tr key={video.id}><td><a className="video-title" href={video.canonicalUrl} target="_blank" rel="noreferrer">{video.title || "TikTok video"}<span>↗</span></a><small className="video-url">{video.canonicalUrl}</small></td><td>{video.creatorHandle ? `@${video.creatorHandle}` : "—"}</td><td>{video.campaigns?.length ?? 0}</td><td>{formatDate(video.createdAt)}</td><td><span className="table-arrow">↗</span></td></tr>)}</tbody></table></div> : <div className="table-empty"><span>▷</span><p>{loading ? "Loading your saved videos…" : "Your analyzed videos will show up here."}</p><button className="text-button" onClick={() => onNavigate("videos")}>Analyze a video <b>→</b></button></div>}
    </section>
  </>;
}

async function copyVideoLink(url: string, onNotice: (notice: Notice | null) => void) {
  try { await navigator.clipboard.writeText(url); onNotice({ kind: "success", message: "Video link copied to clipboard." }); }
  catch { onNotice({ kind: "error", message: "Clipboard access was blocked. Open the video link and copy it manually." }); }
}

function VideosPanel({ videos, loading, onRefresh, onNotice }: { videos: Video[]; loading: boolean; onRefresh: () => Promise<void>; onNotice: (notice: Notice | null) => void }) {
  const [url, setUrl] = useState(""); const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ title?: string | null; creatorHandle?: string | null; canonicalUrl: string; thumbnailUrl?: string | null; note?: string; metadataAvailable?: boolean } | null>(null);
  async function analyze(event: FormEvent) { event.preventDefault(); setBusy(true); setResult(null); onNotice(null); try {
    const response = await fetch("/api/videos/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }); const data = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error("Sign in before saving an analyzed video.");
    if (!response.ok) throw new Error(data.error || "This link could not be analyzed. Check that it is a public TikTok video URL.");
    setResult({ ...data.video, note: data.note, metadataAvailable: data.metadataAvailable }); setUrl(""); await onRefresh(); onNotice({ kind: "success", message: "Video analyzed and saved to your library." });
  } catch (error) { onNotice({ kind: "error", message: error instanceof Error ? error.message : "Unable to analyze this video." }); } finally { setBusy(false); } }
  return <div className="workspace-stack"><section className="surface analyzer-card"><div className="analyzer-symbol">▷</div><div className="analyzer-content"><span className="eyebrow">PUBLIC VIDEO LOOKUP</span><h2>Analyze a TikTok video</h2><p>Paste a video URL or supported TikTok short link. We’ll validate it and retrieve public metadata when TikTok makes it available.</p><form className="analyzer-form" onSubmit={analyze}><label className="sr-only" htmlFor="video-url">TikTok video URL</label><input id="video-url" type="url" required maxLength={500} placeholder="https://www.tiktok.com/@creator/video/..." value={url} onChange={(e) => setUrl(e.target.value)} /><button className="button button-primary" disabled={busy}>{busy ? <><span className="spin">↻</span> Checking</> : <>Analyze link <span>→</span></>}</button></form><small className="form-footnote">Only public information is requested. Metrics may not be available without an approved TikTok API integration.</small></div></section>
    {result && <section className="surface result-card"><div className="result-check">✓</div><div className="result-copy"><span className="eyebrow">SAVED VIDEO</span><h3>{result.title || "TikTok video"}</h3><p>{result.creatorHandle ? `@${result.creatorHandle}` : "Creator metadata unavailable"}</p><a href={result.canonicalUrl} target="_blank" rel="noreferrer">Open on TikTok <span>↗</span></a><div className="inline-note">{result.metadataAvailable ? "Public metadata received." : result.note || "Public metadata unavailable."} Views and engagement are not available from this lookup.</div></div>{result.thumbnailUrl && <img className="video-thumb" src={result.thumbnailUrl} alt="TikTok video preview" />}</section>}
    <section className="surface library-card"><div className="section-title"><div><span className="eyebrow">SAVED LINKS</span><h2>Your video library <span className="sub-count">{videos.length}</span></h2></div><button className="button button-quiet" onClick={() => void onRefresh()} disabled={loading}>↻ Refresh</button></div>
      {videos.length ? <div className="video-list">{videos.map((video) => <article className="video-row" key={video.id}><div className="video-play">▷</div><div className="video-row-text"><a href={video.canonicalUrl} target="_blank" rel="noreferrer">{video.title || "TikTok video"} <span>↗</span></a><small>{video.creatorHandle ? `@${video.creatorHandle} · ` : ""}{video.canonicalUrl}</small></div><span className="pill pill-neutral">{video.metrics?.length ? "Metrics saved" : "Metrics unavailable"}</span><button className="button button-quiet button-small" onClick={() => void copyVideoLink(video.canonicalUrl, onNotice)}>Copy link</button></article>)}</div> : <div className="empty-inline"><span className="empty-icon">▷</span><div><b>{loading ? "Loading library…" : "No saved videos yet"}</b><p>Analyze a public video link to start your library.</p></div></div>}
    </section></div>;
}

function CampaignsPanel({ campaigns, videos, loading, onRefresh, onNotice }: { campaigns: Campaign[]; videos: Video[]; loading: boolean; onRefresh: () => Promise<void>; onNotice: (notice: Notice | null) => void }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [editing, setEditing] = useState<Campaign | null>(null);
  function startCreate() { setEditing(null); setOpen(true); }
  function startEdit(campaign: Campaign) { setEditing(campaign); setOpen(true); }
  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); setBusy(true); onNotice(null);
    const videoIds = form.getAll("videoIds").map(String);
    const payload = {
      name: String(form.get("name") || "").trim(), description: String(form.get("description") || "").trim() || null,
      status: String(form.get("status") || "DRAFT"), startsAt: form.get("startsAt") || null, endsAt: form.get("endsAt") || null, videoIds,
    };
    try {
      const response = await fetch(editing ? `/api/campaigns/${editing.id}` : "/api/campaigns", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error("Sign in to save a campaign.");
      if (!response.ok) throw new Error(data.error || "Campaign could not be saved. Check the dates and try again.");
      const savedName = payload.name; setOpen(false); setEditing(null); await onRefresh(); onNotice({ kind: "success", message: editing ? `Campaign “${savedName}” updated.` : `Campaign “${savedName}” created.` });
    } catch (error) { onNotice({ kind: "error", message: error instanceof Error ? error.message : "Unable to save campaign." }); }
    finally { setBusy(false); }
  }
  async function removeCampaign(campaign: Campaign) {
    if (!window.confirm(`Delete “${campaign.name}”? This removes the campaign and its video links.`)) return;
    setBusy(true); onNotice(null);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" }); const data = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error("Sign in to delete a campaign.");
      if (!response.ok) throw new Error(data.error || "Campaign could not be deleted.");
      await onRefresh(); onNotice({ kind: "success", message: `Campaign “${campaign.name}” deleted.` });
    } catch (error) { onNotice({ kind: "error", message: error instanceof Error ? error.message : "Unable to delete campaign." }); }
    finally { setBusy(false); }
  }
  const selectedVideoIds = new Set(editing?.videos?.map((item) => item.videoId) ?? []);
  return <div className="workspace-stack">
    <div className="toolbar-row"><div><span className="eyebrow">ALL CAMPAIGNS</span><p className="muted-copy">Campaign records are private to your account.</p></div><button className="button button-primary" onClick={() => open ? setOpen(false) : startCreate()}>{open ? "Close form" : "＋ New campaign"}</button></div>
    {open && <section className="surface form-surface"><div className="section-title"><div><span className="eyebrow">CAMPAIGN DETAILS</span><h2>{editing ? "Edit campaign" : "Create a campaign"}</h2></div><span className={`pill pill-${editing?.status.toLowerCase() ?? "draft"}`}>{editing?.status ?? "DRAFT"}</span></div>
      <form className="form-grid" onSubmit={saveCampaign}>
        <label>Campaign name<input name="name" required minLength={1} maxLength={120} defaultValue={editing?.name ?? ""} placeholder="e.g. Spring launch" /></label>
        <label>Status<select name="status" defaultValue={editing?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select></label>
        <label className="form-wide">Description <span className="optional">OPTIONAL</span><textarea name="description" maxLength={2000} rows={3} defaultValue={editing?.description ?? ""} placeholder="What are you promoting?" /></label>
        <label>Start date<input name="startsAt" type="date" defaultValue={editing?.startsAt?.slice(0, 10) ?? ""} /></label>
        <label>End date<input name="endsAt" type="date" defaultValue={editing?.endsAt?.slice(0, 10) ?? ""} /></label>
        <fieldset className="video-picker form-wide"><legend>Link saved videos <span className="optional">OPTIONAL</span></legend>{videos.length ? <div className="video-check-list">{videos.map((video) => <label className="video-check" key={video.id}><input type="checkbox" name="videoIds" value={video.id} defaultChecked={selectedVideoIds.has(video.id)} /><span><b>{video.title || "TikTok video"}</b><small>{video.creatorHandle ? `@${video.creatorHandle} · ` : ""}{video.canonicalUrl}</small></span></label>)}</div> : <p className="muted-copy">Analyze a video first to attach it to this campaign.</p>}</fieldset>
        <div className="form-wide form-actions"><span>Only videos owned by your account can be linked.</span><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes →" : "Create campaign →"}</button></div>
      </form>
    </section>}
    <section className="surface library-card"><div className="section-title"><div><span className="eyebrow">YOUR WORK</span><h2>Campaign list <span className="sub-count">{campaigns.length}</span></h2></div><button className="button button-quiet" onClick={() => void onRefresh()} disabled={loading}>↻ Refresh</button></div>
      {campaigns.length ? <div className="campaign-list">{campaigns.map((campaign) => <article className="campaign-card" key={campaign.id}><div className="campaign-card-head"><span className="campaign-mark large">{campaign.name.slice(0, 1).toUpperCase()}</span><div><span className="eyebrow">CREATED {formatDate(campaign.createdAt).toUpperCase()}</span><h3>{campaign.name}</h3></div><span className={`pill pill-${campaign.status.toLowerCase()}`}>{campaign.status}</span></div><p>{campaign.description || "No description added."}</p><div className="campaign-meta"><span>◷ {formatDate(campaign.startsAt)} – {formatDate(campaign.endsAt)}</span><span>▷ {campaign._count?.videos ?? 0} videos</span></div><div className="campaign-actions"><button className="button button-quiet button-small" onClick={() => startEdit(campaign)}>Edit</button><button className="button button-danger button-small" onClick={() => void removeCampaign(campaign)} disabled={busy}>Delete</button></div></article>)}</div> : <div className="empty-large"><span className="empty-icon">◫</span><h3>{loading ? "Loading campaigns…" : "Your next campaign starts here"}</h3><p>Create a campaign to organize TikTok links and keep your promotional schedule in one place.</p><button className="button button-primary" onClick={startCreate}>Create your first campaign <span>→</span></button></div>}
    </section>
  </div>;
}
function AnalyticsPanel({ videos, loading, onNavigate }: { videos: Video[]; loading: boolean; onNavigate: (panel: Panel) => void }) {
  const snapshots = videos.flatMap((video) => video.metrics ?? []); const fields: [string, "views" | "likes" | "comments" | "shares" | "engagementRate"][] = [["Views", "views"], ["Likes", "likes"], ["Comments", "comments"], ["Shares", "shares"], ["Engagement rate", "engagementRate"]];
  return <div className="workspace-stack"><section className="surface analytics-intro"><div className="analytics-badge">⌁</div><div><span className="eyebrow">AUTHORIZED METRICS ONLY</span><h2>{snapshots.length ? "Available performance snapshots" : "No authorized metrics yet"}</h2><p>{snapshots.length ? "These figures come from saved metric snapshots. CART3R does not estimate missing values." : "TikTok’s public embed metadata does not include views, likes, comments, shares or engagement history. These remain unavailable until an approved integration or authorized import supplies them."}</p></div></section>
    <div className="metrics-grid analytics-metrics">{fields.map(([label, key]) => { const values = snapshots.map((s) => s[key]).filter((v): v is number => typeof v === "number"); const value = values.length ? values.reduce((a, b) => a + b, 0) / (key === "engagementRate" ? values.length : 1) : null; return <MetricCard key={label} label={label.toUpperCase()} value={loading ? "…" : value === null ? "—" : key === "engagementRate" ? value.toFixed(2) : Math.round(value).toLocaleString()} note={values.length ? `${values.length} available snapshot${values.length === 1 ? "" : "s"}` : "Unavailable — no authorized source"} icon={key === "views" ? "◉" : "⌁"} />; })}</div>
    <section className="surface"><div className="section-title"><div><span className="eyebrow">VIDEO COMPARISON</span><h2>Saved video coverage</h2></div><span className="pill pill-neutral">{videos.length} videos</span></div>{videos.length ? <div className="table-scroll"><table><thead><tr><th>VIDEO</th><th>VIEWS</th><th>LIKES</th><th>COMMENTS</th><th>SHARES</th></tr></thead><tbody>{videos.map((v) => { const m = v.metrics?.[0]; return <tr key={v.id}><td>{v.title || "TikTok video"}</td><td>{m?.views?.toLocaleString() ?? "—"}</td><td>{m?.likes?.toLocaleString() ?? "—"}</td><td>{m?.comments?.toLocaleString() ?? "—"}</td><td>{m?.shares?.toLocaleString() ?? "—"}</td></tr>; })}</tbody></table></div> : <div className="empty-inline"><p>Analyze a video to add it to your comparison list.</p><button className="text-button" onClick={() => onNavigate("videos")}>Analyze a video →</button></div>}</section>
    <div className="notice notice-info"><span>i</span><p>Official TikTok analytics access may require Login Kit, Display API permissions and developer approval. CART3R does not create fake engagement or automate accounts.</p><button className="text-button" onClick={() => onNavigate("help")}>Learn more →</button></div></div>;
}

function CaptionsPanel({ onNotice }: { onNotice: (notice: Notice | null) => void }) {
  const [topic, setTopic] = useState(""); const [style, setStyle] = useState("bright"); const [caption, setCaption] = useState("");
  const templates: Record<string, (topic: string) => string> = { bright: (t) => `A little ${t} can go a long way ✨ Save this for later and share it with someone who needs it. #${tag(t)} #TikTokFinds #ForYou`, story: (t) => `We made this for the moments when ${t} matters most. What would you add? Tell us below. #${tag(t)} #BehindTheScenes #MadeForYou`, direct: (t) => `Looking for ${t}? Start here. Tap the link in our profile to learn more. #${tag(t)} #DiscoverMore #ShopSmall` };
  function tag(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24) || "creator"; }
  function generate(event: FormEvent) { event.preventDefault(); const clean = topic.trim(); if (!clean) return; setCaption(templates[style](clean)); onNotice({ kind: "success", message: "Caption draft created. Review it before sharing." }); }
  async function copy() { try { await navigator.clipboard.writeText(caption); onNotice({ kind: "success", message: "Caption copied to clipboard." }); } catch { onNotice({ kind: "error", message: "Clipboard access was blocked. Select and copy the caption manually." }); } }
  return <div className="section-grid tool-grid"><section className="surface tool-form-card"><span className="eyebrow">CAPTION BUILDER</span><h2>Draft a caption with a point of view.</h2><form onSubmit={generate}><label>What is this video about?<input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={100} required placeholder="e.g. handmade ceramic mugs" /></label><label>Writing style<select value={style} onChange={(e) => setStyle(e.target.value)}><option value="bright">Bright & friendly</option><option value="story">Story-led</option><option value="direct">Direct call to action</option></select></label><button className="button button-primary" type="submit">Generate draft <span>→</span></button></form><div className="tool-disclaimer">Drafts are generated locally from templates; no AI API call or automatic posting is used.</div></section><section className="surface caption-output"><div className="section-title"><div><span className="eyebrow">YOUR DRAFT</span><h2>Ready when you are</h2></div><span className="output-orb">✳</span></div>{caption ? <><div className="caption-preview">{caption}</div><div className="caption-meta"><span>EDIT BEFORE PUBLISHING · PREVIEW ONLY</span><span>{caption.length} characters</span></div><button className="button button-quiet" onClick={() => void copy()}>▣ Copy caption</button></> : <div className="empty-large compact"><span className="empty-icon">✳</span><p>Choose a topic and style to draft a promotional caption with a call to action and hashtags.</p></div>}</section></div>;
}

function QrPanel({ onNotice }: { onNotice: (notice: Notice | null) => void }) {
  const [url, setUrl] = useState(""); const [format, setFormat] = useState<"png" | "svg">("png"); const [busy, setBusy] = useState(false); const [image, setImage] = useState("");
  useEffect(() => () => { if (image) URL.revokeObjectURL(image); }, [image]);
  async function generate(event: FormEvent) { event.preventDefault(); setBusy(true); onNotice(null); try {
    const response = await fetch("/api/qr/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, format }) });
    if (response.status === 401) throw new Error("Sign in to generate a QR code."); if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "QR code could not be generated. Check the TikTok URL."); }
    setImage(URL.createObjectURL(await response.blob())); onNotice({ kind: "success", message: `Your ${format.toUpperCase()} QR code is ready to download.` });
  } catch (error) { onNotice({ kind: "error", message: error instanceof Error ? error.message : "Unable to generate QR code." }); } finally { setBusy(false); } }
  return <div className="section-grid tool-grid"><section className="surface tool-form-card"><span className="eyebrow">CAMPAIGN SHARE ASSET</span><h2>Turn a video link into a scan.</h2><form onSubmit={generate}><label>TikTok video URL<input type="url" required maxLength={500} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.tiktok.com/@creator/video/..." /></label><label>File format<select value={format} onChange={(e) => setFormat(e.target.value as "png" | "svg")}><option value="png">PNG · easy to share</option><option value="svg">SVG · scalable artwork</option></select></label><button className="button button-primary" disabled={busy}>{busy ? "Generating…" : "Generate QR code →"}</button></form><p className="tool-disclaimer">Requires sign-in. Only valid TikTok video links are accepted.</p></section><section className="surface qr-output"><span className="eyebrow">PREVIEW</span>{image ? <><div className="qr-frame"><img src={image} alt="Generated QR code for the TikTok video" /></div><a className="button button-quiet" href={image} download={`cart3r-tiktok-qr.${format}`}>↓ Download {format.toUpperCase()}</a></> : <div className="qr-placeholder"><div className="qr-placeholder-code"><i /><i /><i /><i /></div><b>Your QR preview appears here</b><span>Choose a TikTok link and generate an export.</span></div>}</section></div>;
}

function ReportsPanel({ videos, campaigns, onNotice }: { videos: Video[]; campaigns: Campaign[]; onNotice: (notice: Notice | null) => void }) {
  function download() { const rows: unknown[][] = [["record_type", "name_or_title", "status", "url", "creator", "video_count", "created_at", "views", "likes", "comments", "shares"], ...campaigns.map((c) => ["campaign", c.name, c.status, "", "", c._count?.videos ?? 0, c.createdAt, "", "", "", ""]), ...videos.map((v) => { const m = v.metrics?.[0]; return ["video", v.title || "TikTok video", "", v.canonicalUrl, v.creatorHandle ? `@${v.creatorHandle}` : "", v.campaigns?.length ?? 0, v.createdAt, m?.views ?? "", m?.likes ?? "", m?.comments ?? "", m?.shares ?? ""]; })];
    const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n"); const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `cart3r-report-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); onNotice({ kind: "success", message: "CSV report downloaded. Unavailable metrics are left blank." });
  }
  return <div className="workspace-stack"><section className="surface report-banner"><div className="report-mark">▤</div><div><span className="eyebrow">CSV EXPORT</span><h2>Your workspace, portable.</h2><p>Export saved campaigns and analyzed videos, including authorized metrics only. Missing metrics remain blank in the file.</p><button className="button button-primary" onClick={download}>↓ Download CSV report</button></div></section><div className="metrics-grid report-stats"><MetricCard label="CAMPAIGNS" value={String(campaigns.length)} note="Available campaign records" icon="◫" /><MetricCard label="SAVED VIDEOS" value={String(videos.length)} note="Available video records" icon="▷" /><MetricCard label="METRIC VALUES" value={String(videos.reduce((count, v) => count + (v.metrics?.length ?? 0), 0))} note="Saved authorized snapshots" icon="⌁" /></div><div className="notice notice-info"><span>i</span><p>PDF report export and date-range comparisons are not configured yet. The CSV contains all currently loaded records.</p></div></div>;
}

function SettingsPanel() { return <div className="workspace-stack"><section className="surface settings-hero"><span className="eyebrow">ACCOUNT</span><h2>Keep your data yours.</h2><p>CART3R uses account-scoped records. Campaigns, videos and activity are linked to your signed-in user.</p><a className="button button-primary" href="/login">Open account access <span>→</span></a></section><section className="surface settings-row"><div className="settings-icon">◈</div><div><b>Data storage</b><p>Records are stored in the configured PostgreSQL database. Never expose the database URL in frontend code or share it publicly.</p></div><span className="pill pill-neutral">SERVER CONFIG</span></section><section className="surface settings-row"><div className="settings-icon">⌁</div><div><b>Analytics access</b><p>Public TikTok embeds do not provide performance metrics. An approved developer integration is required for additional access.</p></div><span className="pill pill-neutral">LIMITED</span></section><section className="surface settings-row"><div className="settings-icon">⛨</div><div><b>Promotion policy</b><p>CART3R supports legitimate campaign organization only. No fake views, likes, followers, spam or unauthorized account automation.</p></div><span className="pill pill-active">ENABLED</span></section></div>; }
function HelpPanel() { const items = [["Why are views and likes blank?", "TikTok’s public oEmbed response provides limited video metadata and does not include performance statistics. Metrics stay blank unless an authorized source supplies them."], ["What does the TikTok integration need?", "Login Kit, Display API or other approved access depends on the feature and TikTok developer-app review. The app must never invent endpoints, permissions or access tokens."], ["Why can’t I save a campaign?", "Saving requires a signed-in account and a working PostgreSQL DATABASE_URL on the server. A database name by itself is not a connection URL."], ["Does CART3R boost engagement automatically?", "No. CART3R helps organize authentic promotion. It does not generate fake views, likes, followers, comments or automate engagement."]]; return <div className="workspace-stack"><section className="surface help-hero"><span className="eyebrow">STRAIGHT ANSWERS</span><h2>Useful tools. Honest limits.</h2><p>Here’s how CART3R handles TikTok data, account access and promotions.</p></section>{items.map(([question, answer]) => <details className="surface faq-row" key={question}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}<a className="support-link" href="https://developers.tiktok.com/" target="_blank" rel="noreferrer">Explore TikTok for Developers <span>↗</span></a></div>; }
