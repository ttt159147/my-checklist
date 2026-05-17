import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const getToday = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const TODAY = getToday();

const COLORS = [
  { id: "default", bg: "#ffffff", border: "#d1d5db" },
  { id: "red",     bg: "#fef2f2", border: "#fca5a5" },
  { id: "orange",  bg: "#fff7ed", border: "#fdba74" },
  { id: "yellow",  bg: "#fefce8", border: "#fde047" },
  { id: "green",   bg: "#f0fdf4", border: "#86efac" },
  { id: "blue",    bg: "#eff6ff", border: "#93c5fd" },
  { id: "purple",  bg: "#faf5ff", border: "#c4b5fd" },
];

const COLOR_DOT = {
  default: "#9ca3af", red: "#f87171", orange: "#fb923c",
  yellow: "#facc15", green: "#34d399", blue: "#60a5fa", purple: "#a78bfa",
};

const DEFAULT_ITEMS = [
  { id: 1,  text: "クラフトボス",           color: "default", subs: [] },
  { id: 2,  text: "コカ・コーラレシートアップ", color: "default", subs: [] },
  { id: 3,  text: "毎日レシート",            color: "default", subs: [] },
  { id: 4,  text: "バーコードスキャン",       color: "default", subs: [] },
  { id: 5,  text: "ジョージアスキャン",       color: "default", subs: [] },
  { id: 6,  text: "やかんスキャン",          color: "default", subs: [] },
  { id: 7,  text: "綾鷹スキャン",           color: "default", subs: [] },
  { id: 8,  text: "アクエリアススキャン",     color: "default", subs: [] },
  { id: 9,  text: "バーコードx5スキャン",    color: "default", subs: [] },
  { id: 10, text: "yモバイルくじ",          color: "default", subs: [] },
  { id: 11, text: "ソフトバンクくじ",        color: "default", subs: [] },
  { id: 12, text: "エビスおみくじ",          color: "default", subs: [] },
  { id: 13, text: "epark薬クーポン",        color: "default", subs: [] },
];

export default function App() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [checked, setChecked] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [newText, setNewText] = useState("");
  const newTextRef = useRef(null);
  const newSubTextRef = useRef(null);
  const editTextRef = useRef(null);
  const editSubTextRef = useRef(null);
  const [adding, setAdding] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [colorPickerId, setColorPickerId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [addingSubId, setAddingSubId] = useState(null);
  const [newSubText, setNewSubText] = useState("");
  const [editingSubKey, setEditingSubKey] = useState(null);
  const [editSubText, setEditSubText] = useState("");
  const [expandedIds, setExpandedIds] = useState({});

  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);
  const touchStartIndex = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("checklist-data");
      if (raw) {
        const data = JSON.parse(raw);
        const loadedItems = (data.items || DEFAULT_ITEMS).map(i => ({ ...i, subs: i.subs || [] }));
        setItems(loadedItems);
        if (data.date === TODAY) {
          setChecked(data.checked || {});
        } else {
          // 日付が変わったらチェックをリセットして保存
          setChecked({});
          localStorage.setItem("checklist-data", JSON.stringify({ items: loadedItems, checked: {}, date: TODAY }));
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("checklist-data", JSON.stringify({ items, checked, date: TODAY }));
  }, [items, checked, loaded]);

  // メインタスクのチェック → サブタスクも全部連動
  const toggle = (item) => {
    if (editingId === item.id) return;
    setChecked(p => {
      const newVal = !p[item.id];
      const n = { ...p, [item.id]: newVal };
      // メインをチェックON→サブも全ON、メインをOFF→サブはそのまま
      if (newVal && item.subs.length > 0) {
        item.subs.forEach(sub => { n[`sub-${item.id}-${sub.id}`] = true; });
      }
      return n;
    });
  };

  const toggleSub = (itemId, subId) => {
    const key = `sub-${itemId}-${subId}`;
    setChecked(p => ({ ...p, [key]: !p[key] }));
  };

  const toggleExpand = (id) => setExpandedIds(p => ({ ...p, [id]: !p[id] }));

  const addItem = () => {
    const val = newTextRef.current ? newTextRef.current.value.trim() : newText.trim();
    if (!val) return;
    setItems(p => [...p, { id: Date.now(), text: val, color: "default", subs: [] }]);
    setNewText(""); setAdding(false);
  };

  const deleteItem = (id) => {
    setItems(p => p.filter(i => i.id !== id));
    setChecked(p => { const n = { ...p }; delete n[id]; Object.keys(n).forEach(k => { if (k.startsWith(`sub-${id}-`)) delete n[k]; }); return n; });
  };

  const addSub = (itemId) => {
    const val = newSubTextRef.current ? newSubTextRef.current.value.trim() : newSubText.trim();
    if (!val) return;
    setItems(p => p.map(i => i.id === itemId ? { ...i, subs: [...i.subs, { id: Date.now(), text: val }] } : i));
    setExpandedIds(p => ({ ...p, [itemId]: true }));
    setNewSubText(""); setAddingSubId(null);
  };

  const deleteSub = (itemId, subId) => {
    setItems(p => p.map(i => i.id === itemId ? { ...i, subs: i.subs.filter(s => s.id !== subId) } : i));
    setChecked(p => { const n = { ...p }; delete n[`sub-${itemId}-${subId}`]; return n; });
  };

  const startEdit = (item) => { setEditingId(item.id); setEditText(item.text); setColorPickerId(null); };
  const saveEdit = () => {
    const val = editTextRef.current ? editTextRef.current.value.trim() : editText.trim();
    if (!val) return;
    setItems(p => p.map(i => i.id === editingId ? { ...i, text: val } : i));
    setEditingId(null);
  };

  const startEditSub = (itemId, sub) => { setEditingSubKey(`${itemId}-${sub.id}`); setEditSubText(sub.text); };
  const saveEditSub = (itemId, subId) => {
    const val = editSubTextRef.current ? editSubTextRef.current.value.trim() : editSubText.trim();
    if (!val) return;
    setItems(p => p.map(i => i.id === itemId ? { ...i, subs: i.subs.map(s => s.id === subId ? { ...s, text: val } : s) } : i));
    setEditingSubKey(null);
  };

  const setColor = (id, colorId) => { setItems(p => p.map(i => i.id === id ? { ...i, color: colorId } : i)); setColorPickerId(null); };

  // サブタスク並び替え
  const subDragIndex = useRef(null);
  const subDragOverIndex = useRef(null);
  const subDragItemId = useRef(null);

  const onSubDragStart = (itemId, index) => { subDragItemId.current = itemId; subDragIndex.current = index; };
  const onSubDragOver = (e, index) => { e.preventDefault(); subDragOverIndex.current = index; };
  const onSubDrop = (itemId) => {
    const from = subDragIndex.current;
    const to = subDragOverIndex.current;
    if (from === null || to === null || from === to || subDragItemId.current !== itemId) return;
    setItems(p => p.map(i => {
      if (i.id !== itemId) return i;
      const newSubs = [...i.subs];
      const [moved] = newSubs.splice(from, 1);
      newSubs.splice(to, 0, moved);
      return { ...i, subs: newSubs };
    }));
    subDragIndex.current = null;
    subDragOverIndex.current = null;
    subDragItemId.current = null;
  };

  const moveItems = (from, to) => {
    if (from === null || to === null || from === to) return;
    const newItems = [...items]; const [moved] = newItems.splice(from, 1); newItems.splice(to, 0, moved); setItems(newItems);
  };

  const onDragStart = (index) => { dragIndex.current = index; setDraggingIndex(index); };
  const onDragOver = (e, index) => { e.preventDefault(); dragOverIndex.current = index; };
  const onDrop = (index) => { moveItems(dragIndex.current, index); dragIndex.current = null; dragOverIndex.current = null; setDraggingIndex(null); };
  const onDragEnd = () => setDraggingIndex(null);
  const onTouchStart = (e, index) => { touchStartIndex.current = index; setDraggingIndex(index); };
  const onTouchMove = (e) => {
    e.preventDefault();
    const y = e.touches[0].clientY;
    document.querySelectorAll(".checklist-item").forEach((el, i) => { const rect = el.getBoundingClientRect(); if (y > rect.top && y < rect.bottom) dragOverIndex.current = i; });
  };
  const onTouchEnd = () => { moveItems(touchStartIndex.current, dragOverIndex.current); touchStartIndex.current = null; dragOverIndex.current = null; setDraggingIndex(null); };

  const { totalCount, done, pct, allDone } = useMemo(() => {
    const totalCount = items.reduce((acc, i) => acc + 1 + i.subs.length, 0);
    const done = items.reduce((acc, i) => {
      const mainDone = !!checked[i.id] ? 1 : 0;
      const subsDone = i.subs.filter(s => !!checked[`sub-${i.id}-${s.id}`]).length;
      return acc + mainDone + subsDone;
    }, 0);
    const pct = totalCount ? (done / totalCount) * 100 : 0;
    const allDone = totalCount > 0 && done === totalCount;
    return { totalCount, done, pct, allDone };
  }, [items, checked]);

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontFamily: "sans-serif" }}>読み込み中...</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", display: "flex", justifyContent: "center", padding: "28px 16px" }}
      onClick={() => setColorPickerId(null)}>
      <div style={{ width: "100%", maxWidth: "460px" }}>

        <div style={{ fontSize: "11px", color: "#9ca3af", letterSpacing: "0.15em", textAlign: "center", marginBottom: "4px" }}>
          {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </div>
        <h1 style={{ color: "#1f2937", fontSize: "24px", fontWeight: "800", margin: "0 0 20px", textAlign: "center" }}>毎日チェックリスト</h1>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "14px 18px", marginBottom: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ color: "#6b7280", fontSize: "13px" }}>達成度</span>
            <span style={{ color: allDone ? "#10b981" : "#6366f1", fontWeight: "800", fontSize: "20px" }}>
              {done}<span style={{ color: "#d1d5db", fontWeight: "400", fontSize: "13px" }}> / {totalCount}</span>
            </span>
          </div>
          <div style={{ height: "5px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: allDone ? "linear-gradient(90deg,#34d399,#10b981)" : "linear-gradient(90deg,#6366f1,#a78bfa)", borderRadius: "99px", transition: "width 0.35s ease" }} />
          </div>
          {allDone && <div style={{ textAlign: "center", marginTop: "8px", color: "#10b981", fontSize: "13px", fontWeight: "600" }}>🎉 全部完了！</div>}
        </div>

        <div>
          {items.map((item, index) => {
            const c = COLORS.find(c => c.id === (item.color || "default"));
            const isChecked = checked[item.id];
            const isEditing = editingId === item.id;
            const isExpanded = expandedIds[item.id];
            const hasSubs = item.subs.length > 0;

            return (
              <div key={item.id} style={{ marginBottom: "6px" }}>
                <div style={{ position: "relative" }}>
                  <div
                    className="checklist-item"
                    draggable={!isEditing}
                    onDragStart={() => !isEditing && onDragStart(index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDrop={() => onDrop(index)}
                    onDragEnd={onDragEnd}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px",
                      background: draggingIndex === index ? "#e0e7ff" : isChecked ? "#f5f3ff" : c.bg,
                      border: `1px solid ${isEditing ? "#6366f1" : draggingIndex === index ? "#6366f1" : isChecked ? "#c4b5fd" : c.border}`,
                      borderRadius: (hasSubs && isExpanded) ? "11px 11px 0 0" : "11px",
                      opacity: draggingIndex === index ? 0.5 : 1,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      transition: "all 0.15s",
                    }}
                  >
                    <div onTouchStart={(e) => !isEditing && onTouchStart(e, index)} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                      style={{ color: "#d1d5db", cursor: isEditing ? "default" : "grab", fontSize: "18px", flexShrink: 0, padding: "0 2px", touchAction: "none", userSelect: "none" }}>⠿</div>

                    <div onClick={() => toggle(item)}
                      style={{ width: "20px", height: "20px", borderRadius: "5px", border: `2px solid ${isChecked ? "#6366f1" : "#d1d5db"}`, background: isChecked ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                      {isChecked && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>

                    {isEditing ? (
                      <input autoFocus ref={editTextRef} defaultValue={editText}
                        onKeyDown={e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                        onClick={e => e.stopPropagation()}
                        style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #6366f1", color: "#1f2937", fontSize: "15px", outline: "none", padding: "2px 0" }}
                      />
                    ) : (
                      <span onClick={() => toggle(item)} onDoubleClick={() => startEdit(item)}
                        style={{ flex: 1, fontSize: "15px", color: isChecked ? "#9ca3af" : "#1f2937", textDecoration: isChecked ? "line-through" : "none", cursor: "pointer" }}>
                        {item.text}
                      </span>
                    )}

                    {hasSubs && !isEditing && (
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
                        style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "12px", padding: "2px 4px", fontWeight: "600" }}>
                        {isExpanded ? "▲" : `▼${item.subs.length}`}
                      </button>
                    )}

                    {!isEditing && <>
                      <button onClick={(e) => { e.stopPropagation(); setAddingSubId(addingSubId === item.id ? null : item.id); setNewSubText(""); setExpandedIds(p => ({ ...p, [item.id]: true })); }}
                        style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "14px", padding: "2px 4px" }}
                        onMouseEnter={e => e.target.style.color = "#10b981"} onMouseLeave={e => e.target.style.color = "#9ca3af"}>＋</button>
                      <button onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                        style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "13px", padding: "2px 4px" }}
                        onMouseEnter={e => e.target.style.color = "#6366f1"} onMouseLeave={e => e.target.style.color = "#9ca3af"}>✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); setColorPickerId(colorPickerId === item.id ? null : item.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: COLOR_DOT[item.color || "default"], border: "2px solid #e5e7eb" }} />
                      </button>
                      <button onClick={() => deleteItem(item.id)}
                        style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: "14px", padding: "2px 4px" }}
                        onMouseEnter={e => e.target.style.color = "#f87171"} onMouseLeave={e => e.target.style.color = "#d1d5db"}>✕</button>
                    </>}
                    {isEditing && <><button onClick={saveEdit} style={{ background: "#6366f1", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", padding: "4px 8px", cursor: "pointer" }}>保存</button><button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "13px", padding: "2px 4px" }}>✕</button></>}
                  </div>

                  {colorPickerId === item.id && (
                    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: "0", top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "10px", display: "flex", gap: "8px", zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                      {COLORS.map(col => (
                        <button key={col.id} onClick={() => setColor(item.id, col.id)} style={{ width: "22px", height: "22px", borderRadius: "50%", background: COLOR_DOT[col.id], border: (item.color || "default") === col.id ? "2px solid #374151" : "2px solid transparent", cursor: "pointer", padding: 0 }} />
                      ))}
                    </div>
                  )}
                </div>

                {hasSubs && isExpanded && item.subs.map((sub, si) => {
                  const subKey = `sub-${item.id}-${sub.id}`;
                  const isSubChecked = checked[subKey];
                  const isEditingSub = editingSubKey === `${item.id}-${sub.id}`;
                  const isLast = si === item.subs.length - 1 && addingSubId !== item.id;
                  return (
                    <div key={sub.id}
                      draggable
                      onDragStart={() => onSubDragStart(item.id, si)}
                      onDragOver={(e) => onSubDragOver(e, si)}
                      onDrop={() => onSubDrop(item.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px 9px 28px",
                        background: isSubChecked ? "#f5f3ff" : c.bg,
                        border: `1px solid ${c.border}`, borderTop: "none",
                        borderRadius: isLast ? "0 0 11px 11px" : "0",
                        cursor: "default",
                      }}>
                      <span style={{ color: "#d1d5db", cursor: "grab", fontSize: "15px", flexShrink: 0, userSelect: "none" }}>⠿</span>
                      <span style={{ color: "#d1d5db", fontSize: "12px", flexShrink: 0 }}>|--</span>
                      <div onClick={() => toggleSub(item.id, sub.id)}
                        style={{ width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${isSubChecked ? "#6366f1" : "#d1d5db"}`, background: isSubChecked ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                        {isSubChecked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      {isEditingSub ? (
                        <input autoFocus ref={editSubTextRef} defaultValue={editSubText}
                          onKeyDown={e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === "Enter") saveEditSub(item.id, sub.id); if (e.key === "Escape") setEditingSubKey(null); }}
                          
                          style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #6366f1", color: "#1f2937", fontSize: "13px", outline: "none", padding: "1px 0" }}
                        />
                      ) : (
                        <span onDoubleClick={() => startEditSub(item.id, sub)}
                          style={{ flex: 1, fontSize: "13px", color: isSubChecked ? "#9ca3af" : "#4b5563", textDecoration: isSubChecked ? "line-through" : "none" }}>
                          {sub.text}
                        </span>
                      )}
                      {isEditingSub ? (<><button onClick={() => saveEditSub(item.id, sub.id)} style={{ background: "#6366f1", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", padding: "3px 8px", cursor: "pointer" }}>保存</button><button onClick={() => setEditingSubKey(null)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "12px", padding: "1px 3px" }}>✕</button></>) : (<button onClick={() => startEditSub(item.id, sub)}
                        style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: "11px", padding: "1px 3px" }}
                        onMouseEnter={e => e.target.style.color = "#6366f1"} onMouseLeave={e => e.target.style.color = "#d1d5db"}>✏️</button>)}
                      <button onClick={() => deleteSub(item.id, sub.id)}
                        style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: "12px", padding: "1px 3px" }}
                        onMouseEnter={e => e.target.style.color = "#f87171"} onMouseLeave={e => e.target.style.color = "#d1d5db"}>✕</button>
                    </div>
                  );
                })}

                {addingSubId === item.id && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px 8px 36px", background: "#fafafa", border: `1px solid ${c.border}`, borderTop: "none", borderRadius: "0 0 11px 11px" }}>
                    <span style={{ color: "#d1d5db", fontSize: "12px" }}>|--</span>
                    <input autoFocus ref={newSubTextRef}
                      onKeyDown={e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === "Enter") addSub(item.id); if (e.key === "Escape") setAddingSubId(null); }}
                      placeholder="サブタスク名..."
                      style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #6366f1", color: "#1f2937", fontSize: "13px", outline: "none", padding: "2px 0" }}
                    />
                    <button onClick={() => addSub(item.id)} style={{ background: "#6366f1", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", padding: "4px 10px", cursor: "pointer" }}>追加</button>
                    <button onClick={() => setAddingSubId(null)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "12px" }}>✕</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {adding ? (
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <input autoFocus ref={newTextRef}
              onKeyDown={e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === "Enter") addItem(); if (e.key === "Escape") setAdding(false); }}
              placeholder="タスク名を入力..."
              style={{ flex: 1, padding: "11px 13px", background: "#fff", border: "1px solid #6366f1", borderRadius: "10px", color: "#1f2937", fontSize: "15px", outline: "none" }}
            />
            <button onClick={addItem} style={{ padding: "11px 16px", background: "#6366f1", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>追加</button>
            <button onClick={() => { setAdding(false); setNewText(""); }} style={{ padding: "11px 13px", background: "#e5e7eb", border: "none", borderRadius: "10px", color: "#6b7280", cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ width: "100%", padding: "12px", background: "transparent", border: "1px dashed #d1d5db", borderRadius: "11px", color: "#9ca3af", fontSize: "14px", cursor: "pointer", marginTop: "8px" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#6366f1"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#9ca3af"; }}
          >＋ タスクを追加</button>
        )}

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button onClick={() => setChecked({})}
            style={{ background: "none", border: "none", color: "#d1d5db", fontSize: "12px", cursor: "pointer", padding: "6px 14px", borderRadius: "8px" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "#fef2f2"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#d1d5db"; e.currentTarget.style.background = "none"; }}
          >🔄 チェックをリセット</button>
        </div>

      </div>
    </div>
  );
}
