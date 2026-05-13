import { useState, useEffect, useRef } from "react";

const TODAY = new Date().toISOString().slice(0, 10);

const COLORS = [
  { id: "default", bg: "#13131e", border: "#1e1e30" },
  { id: "red",     bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.35)" },
  { id: "orange",  bg: "rgba(251,146,60,0.1)",  border: "rgba(251,146,60,0.35)" },
  { id: "yellow",  bg: "rgba(250,204,21,0.1)",  border: "rgba(250,204,21,0.35)" },
  { id: "green",   bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.35)" },
  { id: "blue",    bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.35)" },
  { id: "purple",  bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.35)" },
];

const COLOR_DOT = {
  default: "#3a3a55", red: "#f87171", orange: "#fb923c",
  yellow: "#facc15", green: "#34d399", blue: "#60a5fa", purple: "#a78bfa",
};

const DEFAULT_ITEMS = [
  { id: 1,  text: "クラフトボス",           color: "default" },
  { id: 2,  text: "コカ・コーラレシートアップ", color: "default" },
  { id: 3,  text: "毎日レシート",            color: "default" },
  { id: 4,  text: "バーコードスキャン",       color: "default" },
  { id: 5,  text: "ジョージアスキャン",       color: "default" },
  { id: 6,  text: "やかんスキャン",          color: "default" },
  { id: 7,  text: "綾鷹スキャン",           color: "default" },
  { id: 8,  text: "アクエリアススキャン",     color: "default" },
  { id: 9,  text: "バーコードx5スキャン",    color: "default" },
  { id: 10, text: "yモバイルくじ",          color: "default" },
  { id: 11, text: "ソフトバンクくじ",        color: "default" },
  { id: 12, text: "エビスおみくじ",          color: "default" },
  { id: 13, text: "epark薬クーポン",        color: "default" },
];

export default function App() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [checked, setChecked] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [colorPickerId, setColorPickerId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);
  const touchStartIndex = useRef(null);

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

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("checklist-data", JSON.stringify({ items, checked, date: TODAY }));
  }, [items, checked, loaded]);

  const toggle = (id) => {
    if (editingId === id) return;
    setChecked(p => ({ ...p, [id]: !p[id] }));
  };

  const addItem = () => {
    if (!newText.trim()) return;
    setItems(p => [...p, { id: Date.now(), text: newText.trim(), color: "default" }]);
    setNewText("");
    setAdding(false);
  };

  const deleteItem = (id) => {
    setItems(p => p.filter(i => i.id !== id));
    setChecked(p => { const n = { ...p }; delete n[id]; return n; });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
    setColorPickerId(null);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    setItems(p => p.map(i => i.id === editingId ? { ...i, text: editText.trim() } : i));
    setEditingId(null);
  };

  const setColor = (id, colorId) => {
    setItems(p => p.map(i => i.id === id ? { ...i, color: colorId } : i));
    setColorPickerId(null);
  };

  const moveItems = (from, to) => {
    if (from === null || to === null || from === to) return;
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    setItems(newItems);
  };

  const onDragStart = (index) => { dragIndex.current = index; setDraggingIndex(index); };
  const onDragOver = (e, index) => { e.preventDefault(); dragOverIndex.current = index; };
  const onDrop = (index) => { moveItems(dragIndex.current, index); dragIndex.current = null; dragOverIndex.current = null; setDraggingIndex(null); };
  const onDragEnd = () => setDraggingIndex(null);

  const onTouchStart = (e, index) => { touchStartIndex.current = index; setDraggingIndex(index); };
  const onTouchMove = (e) => {
    e.preventDefault();
    const y = e.touches[0].clientY;
    document.querySelectorAll(".checklist-item").forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (y > rect.top && y < rect.bottom) dragOverIndex.current = i;
    });
  };
  const onTouchEnd = () => { moveItems(touchStartIndex.current, dragOverIndex.current); touchStartIndex.current = null; dragOverIndex.current = null; setDraggingIndex(null); };

  const done = items.filter(i => checked[i.id]).length;
  const pct = items.length ? (done / items.length) * 100 : 0;
  const allDone = done === items.length && items.length > 0;

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a5a72", fontFamily: "sans-serif" }}>読み込み中...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", display: "flex", justifyContent: "center", padding: "28px 16px" }}
      onClick={() => { setColorPickerId(null); }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>

        <div style={{ fontSize: "11px", color: "#444460", letterSpacing: "0.15em", textAlign: "center", marginBottom: "4px" }}>
          {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </div>
        <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "800", margin: "0 0 20px", textAlign: "center" }}>毎日チェックリスト</h1>

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

        <div>
          {items.map((item, index) => {
            const c = COLORS.find(c => c.id === (item.color || "default"));
            const isChecked = checked[item.id];
            const isEditing = editingId === item.id;
            return (
              <div key={item.id} style={{ position: "relative", marginBottom: "5px" }}>
                <div
                  className="checklist-item"
                  draggable={!isEditing}
                  onDragStart={() => !isEditing && onDragStart(index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={() => onDrop(index)}
                  onDragEnd={onDragEnd}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px",
                    background: draggingIndex === index ? "rgba(99,102,241,0.15)" : isChecked ? "rgba(99,102,241,0.07)" : c.bg,
                    border: `1px solid ${isEditing ? "#6366f1" : draggingIndex === index ? "#6366f1" : isChecked ? "rgba(99,102,241,0.22)" : c.border}`,
                    borderRadius: "11px", opacity: draggingIndex === index ? 0.5 : 1, transition: "all 0.15s",
                  }}
                >
                  {/* ドラッグハンドル */}
                  <div
                    onTouchStart={(e) => !isEditing && onTouchStart(e, index)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    style={{ color: "#3a3a55", cursor: isEditing ? "default" : "grab", fontSize: "18px", flexShrink: 0, padding: "0 2px", touchAction: "none", userSelect: "none" }}
                  >⠿</div>

                  {/* チェックボックス */}
                  <div
                    onClick={() => toggle(item.id)}
                    style={{ width: "20px", height: "20px", borderRadius: "5px", border: `2px solid ${isChecked ? "#6366f1" : "#2e2e42"}`, background: isChecked ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
                  >
                    {isChecked && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>

                  {/* テキスト or 編集input */}
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                      onBlur={saveEdit}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #6366f1", color: "#fff", fontSize: "15px", outline: "none", padding: "2px 0" }}
                    />
                  ) : (
                    <span
                      onClick={() => toggle(item.id)}
                      onDoubleClick={() => startEdit(item)}
                      style={{ flex: 1, fontSize: "15px", color: isChecked ? "#3a3a55" : "#d1d1e0", textDecoration: isChecked ? "line-through" : "none", cursor: "pointer" }}
                    >{item.text}</span>
                  )}

                  {/* 編集ボタン */}
                  {!isEditing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                      style={{ background: "none", border: "none", color: "#2a2a40", cursor: "pointer", fontSize: "13px", padding: "2px 4px" }}
                      onMouseEnter={e => e.target.style.color = "#818cf8"}
                      onMouseLeave={e => e.target.style.color = "#2a2a40"}
                    >✏️</button>
                  )}

                  {/* 色ボタン */}
                  {!isEditing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setColorPickerId(colorPickerId === item.id ? null : item.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}
                    >
                      <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: COLOR_DOT[item.color || "default"], border: "2px solid #2a2a40" }} />
                    </button>
                  )}

                  {/* 削除ボタン */}
                  {isEditing ? (
                    <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "#5a5a72", cursor: "pointer", fontSize: "13px", padding: "2px 4px" }}>✕</button>
                  ) : (
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{ background: "none", border: "none", color: "#2a2a40", cursor: "pointer", fontSize: "14px", padding: "2px 4px" }}
                      onMouseEnter={e => e.target.style.color = "#f87171"}
                      onMouseLeave={e => e.target.style.color = "#2a2a40"}
                    >✕</button>
                  )}
                </div>

                {/* カラーピッカー */}
                {colorPickerId === item.id && (
                  <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: "0", top: "calc(100% + 4px)", background: "#1e1e2e", border: "1px solid #2e2e42", borderRadius: "12px", padding: "10px", display: "flex", gap: "8px", zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                    {COLORS.map(col => (
                      <button key={col.id} onClick={() => setColor(item.id, col.id)} style={{ width: "22px", height: "22px", borderRadius: "50%", background: COLOR_DOT[col.id], border: (item.color || "default") === col.id ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", padding: 0 }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {adding ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <input autoFocus value={newText} onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addItem(); if (e.key === "Escape") setAdding(false); }}
              placeholder="タスク名を入力..."
              style={{ flex: 1, padding: "11px 13px", background: "#13131e", border: "1px solid #6366f1", borderRadius: "10px", color: "#fff", fontSize: "15px", outline: "none" }}
            />
            <button onClick={addItem} style={{ padding: "11px 16px", background: "#6366f1", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>追加</button>
            <button onClick={() => { setAdding(false); setNewText(""); }} style={{ padding: "11px 13px", background: "#1e1e2e", border: "none", borderRadius: "10px", color: "#5a5a72", cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ width: "100%", padding: "12px", background: "transparent", border: "1px dashed #2a2a3e", borderRadius: "11px", color: "#444460", fontSize: "14px", cursor: "pointer", marginTop: "8px" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#818cf8"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3e"; e.currentTarget.style.color = "#444460"; }}
          >＋ タスクを追加</button>
        )}

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button onClick={() => setChecked({})}
            style={{ background: "none", border: "none", color: "#333348", fontSize: "12px", cursor: "pointer", padding: "6px 14px", borderRadius: "8px" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#333348"; e.currentTarget.style.background = "none"; }}
          >🔄 チェックをリセット</button>
        </div>

      </div>
    </div>
  );
}
