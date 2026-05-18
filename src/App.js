import { useState, useEffect, useRef, useMemo } from "react";

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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
  default:"#9ca3af", red:"#f87171", orange:"#fb923c",
  yellow:"#facc15", green:"#34d399", blue:"#60a5fa", purple:"#a78bfa",
};

const DEFAULT_ITEMS = [
  { id:1, text:"テスト", color:"default", subs:[] },
];

// 入力コンポーネント（非制御）
function TextInput({ placeholder, onSave, onCancel, defaultValue = "", style = {}, inputStyle = {}, saveLabel = "追加" }) {
  const ref = useRef(null);

  const handleSave = () => {
    const val = ref.current?.value?.trim();
    if (val) onSave(val);
  };

  const handleKey = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div style={{ display: "flex", gap: "8px", ...style }}>
      <input
        ref={ref}
        autoFocus
        defaultValue={defaultValue}
        onKeyDown={handleKey}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{ flex: 1, padding: "11px 13px", background: "#fff", border: "1px solid #6366f1", borderRadius: "10px", color: "#1f2937", fontSize: "15px", outline: "none", ...inputStyle }}
      />
      <button onClick={handleSave} style={{ padding: "11px 16px", background: "#6366f1", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>{saveLabel}</button>
      <button onClick={onCancel} style={{ padding: "11px 13px", background: "#e5e7eb", border: "none", borderRadius: "10px", color: "#6b7280", cursor: "pointer" }}>✕</button>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [checked, setChecked] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [colorPickerId, setColorPickerId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addingSubId, setAddingSubId] = useState(null);
  const [editingSubKey, setEditingSubKey] = useState(null);
  const [expandedIds, setExpandedIds] = useState({});

  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);
  const touchStartIndex = useRef(null);
  const subDragIndex = useRef(null);
  const subDragOverIndex = useRef(null);
  const subDragItemId = useRef(null);

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

  const toggle = (item) => {
    if (editingId === item.id) return;
    setChecked(p => {
      const newVal = !p[item.id];
      const n = { ...p, [item.id]: newVal };
      if (newVal && item.subs.length > 0) {
        item.subs.forEach(sub => { n[`sub-${item.id}-${sub.id}`] = true; });
      }
      return n;
    });
  };

  const toggleSub = (itemId, subId) => {
    setChecked(p => ({ ...p, [`sub-${itemId}-${subId}`]: !p[`sub-${itemId}-${subId}`] }));
  };

  const toggleExpand = (id) => setExpandedIds(p => ({ ...p, [id]: !p[id] }));

  const addItem = (text) => {
    setItems(p => [...p, { id: Date.now(), text, color: "default", subs: [] }]);
    setAdding(false);
  };

  const deleteItem = (id) => {
    setItems(p => p.filter(i => i.id !== id));
    setChecked(p => { const n = { ...p }; delete n[id]; Object.keys(n).forEach(k => { if (k.startsWith(`sub-${id}-`)) delete n[k]; }); return n; });
  };

  const saveEdit = (text) => {
    setItems(p => p.map(i => i.id === editingId ? { ...i, text } : i));
    setEditingId(null);
  };

  const addSub = (itemId, text) => {
    setItems(p => p.map(i => i.id === itemId ? { ...i, subs: [...i.subs, { id: Date.now(), text }] } : i));
    setExpandedIds(p => ({ ...p, [itemId]: true }));
    setAddingSubId(null);
  };

  const deleteSub = (itemId, subId) => {
    setItems(p => p.map(i => i.id === itemId ? { ...i, subs: i.subs.filter(s => s.id !== subId) } : i));
    setChecked(p => { const n = { ...p }; delete n[`sub-${itemId}-${subId}`]; return n; });
  };

  const saveEditSub = (itemId, subId, text) => {
    setItems(p => p.map(i => i.id === itemId ? { ...i, subs: i.subs.map(s => s.id === subId ? { ...s, text } : s) } : i));
    setEditingSubKey(null);
  };

  const setColor = (id, colorId) => { setItems(p => p.map(i => i.id === id ? { ...i, color: colorId } : i)); setColorPickerId(null); };

  const moveItems = (from, to) => {
    if (from === null || to === null || from === to) return;
    const arr = [...items]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); setItems(arr);
  };

  const onDragStart = (i) => { dragIndex.current = i; setDraggingIndex(i); };
  const onDragOver = (e, i) => { e.preventDefault(); dragOverIndex.current = i; };
  const onDrop = (i) => { moveItems(dragIndex.current, i); dragIndex.current = null; dragOverIndex.current = null; setDraggingIndex(null); };
  const onDragEnd = () => setDraggingIndex(null);
  const onTouchStart = (e, i) => { touchStartIndex.current = i; setDraggingIndex(i); };
  const onTouchMove = (e) => {
    e.preventDefault();
    const y = e.touches[0].clientY;
    document.querySelectorAll(".checklist-item").forEach((el, i) => { const r = el.getBoundingClientRect(); if (y > r.top && y < r.bottom) dragOverIndex.current = i; });
  };
  const onTouchEnd = () => { moveItems(touchStartIndex.current, dragOverIndex.current); touchStartIndex.current = null; dragOverIndex.current = null; setDraggingIndex(null); };

  const onSubDragStart = (itemId, i) => { subDragItemId.current = itemId; subDragIndex.current = i; };
  const onSubDragOver = (e, i) => { e.preventDefault(); subDragOverIndex.current = i; };
  const onSubDrop = (itemId) => {
    const from = subDragIndex.current; const to = subDragOverIndex.current;
    if (from === null || to === null || from === to) return;
    setItems(p => p.map(i => {
      if (i.id !== itemId) return i;
      const arr = [...i.subs]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); return { ...i, subs: arr };
    }));
    subDragIndex.current = null; subDragOverIndex.current = null; subDragItemId.current = null;
  };

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

  if (!loaded) return <div style={{ minHeight:"100vh", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", color:"#9ca3af" }}>読み込み中...</div>;

  return (
    <div style={{ minHeight:"100vh", background:"#f3f4f6", fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif", display:"flex", justifyContent:"center", padding:"28px 16px" }}
      onClick={() => setColorPickerId(null)}>
      <div style={{ width:"100%", maxWidth:"460px" }}>

        <div style={{ fontSize:"11px", color:"#9ca3af", letterSpacing:"0.15em", textAlign:"center", marginBottom:"4px" }}>
          {new Date().toLocaleDateString("ja-JP", { year:"numeric", month:"long", day:"numeric", weekday:"long" })}
        </div>
        <h1 style={{ color:"#1f2937", fontSize:"24px", fontWeight:"800", margin:"0 0 20px", textAlign:"center" }}>毎日チェックリスト</h1>

        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:"14px", padding:"14px 18px", marginBottom:"14px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
            <span style={{ color:"#6b7280", fontSize:"13px" }}>達成度</span>
            <span style={{ color:allDone?"#10b981":"#6366f1", fontWeight:"800", fontSize:"20px" }}>
              {done}<span style={{ color:"#d1d5db", fontWeight:"400", fontSize:"13px" }}> / {totalCount}</span>
            </span>
          </div>
          <div style={{ height:"5px", background:"#f3f4f6", borderRadius:"99px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:allDone?"linear-gradient(90deg,#34d399,#10b981)":"linear-gradient(90deg,#6366f1,#a78bfa)", borderRadius:"99px", transition:"width 0.35s ease" }} />
          </div>
          {allDone && <div style={{ textAlign:"center", marginTop:"8px", color:"#10b981", fontSize:"13px", fontWeight:"600" }}>🎉 全部完了！</div>}
        </div>

        <div>
          {items.map((item, index) => {
            const c = COLORS.find(c => c.id === (item.color || "default"));
            const isChecked = !!checked[item.id];
            const isEditing = editingId === item.id;
            const isExpanded = expandedIds[item.id];
            const hasSubs = item.subs.length > 0;

            return (
              <div key={item.id} style={{ marginBottom:"6px" }}>
                <div style={{ position:"relative" }}>
                  <div className="checklist-item" draggable={!isEditing}
                    onDragStart={() => !isEditing && onDragStart(index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDrop={() => onDrop(index)}
                    onDragEnd={onDragEnd}
                    style={{
                      display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px",
                      background: draggingIndex===index?"#e0e7ff":isChecked?"#f5f3ff":c.bg,
                      border:`1px solid ${isEditing?"#6366f1":draggingIndex===index?"#6366f1":isChecked?"#c4b5fd":c.border}`,
                      borderRadius:(hasSubs&&isExpanded)?"11px 11px 0 0":"11px",
                      opacity:draggingIndex===index?0.5:1, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", transition:"all 0.15s",
                    }}>
                    <div onTouchStart={(e) => !isEditing && onTouchStart(e, index)} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                      style={{ color:"#d1d5db", cursor:isEditing?"default":"grab", fontSize:"18px", flexShrink:0, padding:"0 2px", touchAction:"none", userSelect:"none" }}>⠿</div>

                    <div onClick={() => toggle(item)}
                      style={{ width:"20px", height:"20px", borderRadius:"5px", border:`2px solid ${isChecked?"#6366f1":"#d1d5db"}`, background:isChecked?"#6366f1":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer" }}>
                      {isChecked && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>

                    {isEditing ? (
                      <TextInput
                        defaultValue={item.text}
                        placeholder="タスク名..."
                        saveLabel="保存"
                        onSave={saveEdit}
                        onCancel={() => setEditingId(null)}
                        style={{ flex:1 }}
                        inputStyle={{ padding:"4px 8px", fontSize:"15px", borderRadius:"6px" }}
                      />
                    ) : (
                      <span onClick={() => toggle(item)}
                        style={{ flex:1, fontSize:"15px", color:isChecked?"#9ca3af":"#1f2937", textDecoration:isChecked?"line-through":"none", cursor:"pointer" }}>
                        {item.text}
                      </span>
                    )}

                    {!isEditing && <>
                      {hasSubs && <button onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
                        style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:"12px", padding:"2px 4px", fontWeight:"600" }}>
                        {isExpanded?"▲":`▼${item.subs.length}`}</button>}
                      <button onClick={(e) => { e.stopPropagation(); setAddingSubId(item.id); setExpandedIds(p=>({...p,[item.id]:true})); }}
                        style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:"14px", padding:"2px 4px" }}
                        onMouseEnter={e=>e.target.style.color="#10b981"} onMouseLeave={e=>e.target.style.color="#9ca3af"}>＋</button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }}
                        style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:"13px", padding:"2px 4px" }}
                        onMouseEnter={e=>e.target.style.color="#6366f1"} onMouseLeave={e=>e.target.style.color="#9ca3af"}>✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); setColorPickerId(colorPickerId===item.id?null:item.id); }}
                        style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px", flexShrink:0 }}>
                        <div style={{ width:"12px", height:"12px", borderRadius:"50%", background:COLOR_DOT[item.color||"default"], border:"2px solid #e5e7eb" }} />
                      </button>
                      <button onClick={() => deleteItem(item.id)}
                        style={{ background:"none", border:"none", color:"#d1d5db", cursor:"pointer", fontSize:"14px", padding:"2px 4px" }}
                        onMouseEnter={e=>e.target.style.color="#f87171"} onMouseLeave={e=>e.target.style.color="#d1d5db"}>✕</button>
                    </>}
                  </div>

                  {colorPickerId===item.id && (
                    <div onClick={e=>e.stopPropagation()} style={{ position:"absolute", right:"0", top:"calc(100% + 4px)", background:"#fff", border:"1px solid #e5e7eb", borderRadius:"12px", padding:"10px", display:"flex", gap:"8px", zIndex:100, boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
                      {COLORS.map(col => (
                        <button key={col.id} onClick={() => setColor(item.id, col.id)} style={{ width:"22px", height:"22px", borderRadius:"50%", background:COLOR_DOT[col.id], border:(item.color||"default")===col.id?"2px solid #374151":"2px solid transparent", cursor:"pointer", padding:0 }} />
                      ))}
                    </div>
                  )}
                </div>

                {hasSubs && isExpanded && item.subs.map((sub, si) => {
                  const subKey = `sub-${item.id}-${sub.id}`;
                  const isSubChecked = !!checked[subKey];
                  const isEditingSub = editingSubKey === `${item.id}-${sub.id}`;
                  const isLast = si === item.subs.length-1 && addingSubId !== item.id;
                  return (
                    <div key={sub.id} draggable
                      onDragStart={() => onSubDragStart(item.id, si)}
                      onDragOver={(e) => onSubDragOver(e, si)}
                      onDrop={() => onSubDrop(item.id)}
                      style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 14px 9px 28px", background:isSubChecked?"#f5f3ff":c.bg, border:`1px solid ${c.border}`, borderTop:"none", borderRadius:isLast?"0 0 11px 11px":"0" }}>
                      <span style={{ color:"#d1d5db", cursor:"grab", fontSize:"15px", flexShrink:0, userSelect:"none" }}>⠿</span>
                      <span style={{ color:"#d1d5db", fontSize:"12px", flexShrink:0 }}>|--</span>
                      <div onClick={() => toggleSub(item.id, sub.id)}
                        style={{ width:"16px", height:"16px", borderRadius:"4px", border:`2px solid ${isSubChecked?"#6366f1":"#d1d5db"}`, background:isSubChecked?"#6366f1":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer" }}>
                        {isSubChecked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>

                      {isEditingSub ? (
                        <TextInput
                          defaultValue={sub.text}
                          placeholder="サブタスク名..."
                          saveLabel="保存"
                          onSave={(text) => saveEditSub(item.id, sub.id, text)}
                          onCancel={() => setEditingSubKey(null)}
                          style={{ flex:1 }}
                          inputStyle={{ padding:"3px 8px", fontSize:"13px", borderRadius:"6px" }}
                        />
                      ) : (
                        <span style={{ flex:1, fontSize:"13px", color:isSubChecked?"#9ca3af":"#4b5563", textDecoration:isSubChecked?"line-through":"none" }}>{sub.text}</span>
                      )}

                      {!isEditingSub && <>
                        <button onClick={() => setEditingSubKey(`${item.id}-${sub.id}`)}
                          style={{ background:"none", border:"none", color:"#d1d5db", cursor:"pointer", fontSize:"11px", padding:"1px 3px" }}
                          onMouseEnter={e=>e.target.style.color="#6366f1"} onMouseLeave={e=>e.target.style.color="#d1d5db"}>✏️</button>
                        <button onClick={() => deleteSub(item.id, sub.id)}
                          style={{ background:"none", border:"none", color:"#d1d5db", cursor:"pointer", fontSize:"12px", padding:"1px 3px" }}
                          onMouseEnter={e=>e.target.style.color="#f87171"} onMouseLeave={e=>e.target.style.color="#d1d5db"}>✕</button>
                      </>}
                    </div>
                  );
                })}

                {addingSubId===item.id && (
                  <div style={{ padding:"8px 14px 8px 28px", background:c.bg, border:`1px solid ${c.border}`, borderTop:"none", borderRadius:"0 0 11px 11px" }}>
                    <TextInput
                      placeholder="サブタスク名..."
                      saveLabel="追加"
                      onSave={(text) => addSub(item.id, text)}
                      onCancel={() => setAddingSubId(null)}
                      inputStyle={{ padding:"6px 10px", fontSize:"13px", borderRadius:"6px" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {adding ? (
          <div style={{ marginTop:"8px" }}>
            <TextInput
              placeholder="タスク名を入力..."
              saveLabel="追加"
              onSave={addItem}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ width:"100%", padding:"12px", background:"transparent", border:"1px dashed #d1d5db", borderRadius:"11px", color:"#9ca3af", fontSize:"14px", cursor:"pointer", marginTop:"8px" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor="#6366f1"; e.currentTarget.style.color="#6366f1"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#d1d5db"; e.currentTarget.style.color="#9ca3af"; }}
          >＋ タスクを追加</button>
        )}

        <div style={{ textAlign:"center", marginTop:"16px" }}>
          <button onClick={() => setChecked({})}
            style={{ background:"none", border:"none", color:"#d1d5db", fontSize:"12px", cursor:"pointer", padding:"6px 14px", borderRadius:"8px" }}
            onMouseEnter={e=>{ e.currentTarget.style.color="#f87171"; e.currentTarget.style.background="#fef2f2"; }}
            onMouseLeave={e=>{ e.currentTarget.style.color="#d1d5db"; e.currentTarget.style.background="none"; }}
          >🔄 チェックをリセット</button>
        </div>

      </div>
    </div>
  );
}
