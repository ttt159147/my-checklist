import { useState, useEffect } from "react";

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_ITEMS = [
  { id: 1, text: "クラフトボス" },
  { id: 2, text: "コカ・コーラレシートアップ" },
  { id: 3, text: "毎日レシート" },
  { id: 4, text: "バーコードスキャン" },
  { id: 5, text: "ジョージアスキャン" },
  { id: 6, text: "やかんスキャン" },
  { id: 7, text: "綾鷹スキャン" },
  { id: 8, text: "アクエリアススキャン" },
  { id: 9, text: "バーコードx5スキャン" },
  { id: 10, text: "yモバイルくじ" },
  { id: 11, text: "ソフトバンクくじ" },
  { id: 12, text: "エビスおみくじ" },
  { id: 13, text: "epark薬クーポン" },
];

export default function App() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [checked, setChecked] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  // 読み込み
  useEffect(() => {
    try {
      const raw = localStorage.getItem("checklist-data");
      if (raw) {
        const data = JSON.parse(raw);
        setItems(data.items || DEFAULT_ITEMS);
        setChecked(data.date === TODAY ? (data.checked || {}) : {});
      }
    } catch {}
    setLoaded(true);
  }, []);

  // 保存
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("checklist-data", JSON.stringify({ items, checked, date: TODAY }));
  }, [items, checked, loaded]);

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));

  const addItem = () => {
    if (!newText.trim()) return;
    setItems(p => [...p, { id: Date.now(), text: newText.trim() }]);
    setNewText("");
    setAdding(false);
  };

  const deleteItem = (id) => {
    setItems(p => p.filter(i => i.id !== id));
    setChecked(p => { const n = { ...p }; delete n[id]; return n; });
  };

  const done = items.filter(i => checked[i.id]).length;
  const pct = items.length ? (done / items.length) * 100 : 0;
  const allDone = done === items.length && items.length > 0;

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a5a72", fontFamily: "sans-serif" }}>
      読み込み中...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", display: "flex", justifyContent: "center", padding: "28px 16px" }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>

        <div style={{ fontSize: "11px", color: "#444460", letterSpacing: "0.15em", textAlign: "center", marginBottom: "4px" }}>
          {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </div>
        <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "800", margin: "0 0 20px", textAlign: "center" }}>毎日チェックリスト</h1>

        {/* 進捗バー */}
        <div style={{ background: "#13131e", border: "1px solid #1e1e30", borderRadius: "14px", padding: "14px 18px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ color: "#5a5a72", fontSize: "13px" }}>達成度</span>
            <span style={{ color: allDone ? "#34d399" : "#818cf8", fontWeight: "800", fontSize: "20px" }}>
              {done}<span style={{ color: "#3a3a55", fontWeight: "400", fontSize: "13px" }}> / {items.length}</span>
            </span>
          </div>
          <div style={{ height: "5px", background: "#1e1e2e", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: allDone ? "linear-gradient(90deg,#34d399,#10b981)" : "linear-gradient(90deg,#6366f1,#a78bfa)", borderRadius: "99px", transition: "width 0.35s ease" }} />
          </div>
          {allDone && <div style={{ textAlign: "center", marginTop: "8px", color: "#34d399", fontSize: "13px", fontWeight: "600" }}>🎉 全部完了！</div>}
        </div>

        {/* チェックリスト */}
        <div>
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: checked[item.id] ? "rgba(99,102,241,0.07)" : "#13131e", border: `1px solid ${checked[item.id] ? "rgba(99,102,241,0.22)" : "#1e1e30"}`, borderRadius: "11px", cursor: "pointer", marginBottom: "5px" }}
            >
              <div style={{ width: "20px", height: "20px", borderRadius: "5px", border: `2px solid ${checked[item.id] ? "#6366f1" : "#2e2e42"}`, background: checked[item.id] ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {checked[item.id] && (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ flex: 1, fontSize: "15px", color: checked[item.id] ? "#3a3a55" : "#d1d1e0", textDecoration: checked[item.id] ? "line-through" : "none" }}>
                {item.text}
              </span>
              <button
                onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                style={{ background: "none", border: "none", color: "#2a2a40", cursor: "pointer", fontSize: "14px", padding: "2px 6px" }}
                onMouseEnter={e => e.target.style.color = "#f87171"}
                onMouseLeave={e => e.target.style.color = "#2a2a40"}
              >✕</button>
            </div>
          ))}
        </div>

        {/* 追加 */}
        {adding ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <input
              autoFocus value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addItem(); if (e.key === "Escape") setAdding(false); }}
              placeholder="タスク名を入力..."
              style={{ flex: 1, padding: "11px 13px", background: "#13131e", border: "1px solid #6366f1", borderRadius: "10px", color: "#fff", fontSize: "15px", outline: "none" }}
            />
            <button onClick={addItem} style={{ padding: "11px 16px", background: "#6366f1", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>追加</button>
            <button onClick={() => { setAdding(false); setNewText(""); }} style={{ padding: "11px 13px", background: "#1e1e2e", border: "none", borderRadius: "10px", color: "#5a5a72", cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{ width: "100%", padding: "12px", background: "transparent", border: "1px dashed #2a2a3e", borderRadius: "11px", color: "#444460", fontSize: "14px", cursor: "pointer", marginTop: "8px" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#818cf8"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3e"; e.currentTarget.style.color = "#444460"; }}
          >＋ タスクを追加</button>
        )}

        {/* リセット */}
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button
            onClick={() => setChecked({})}
            style={{ background: "none", border: "none", color: "#333348", fontSize: "12px", cursor: "pointer", padding: "6px 14px", borderRadius: "8px" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#333348"; e.currentTarget.style.background = "none"; }}
          >🔄 チェックをリセット</button>
        </div>

      </div>
    </div>
  );
}
