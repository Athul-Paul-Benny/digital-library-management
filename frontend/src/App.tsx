import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  BookOpen,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  BookCopy,
  Clock3,
  Edit3,
  Grid2X2,
  Library,
  LogOut,
  Menu,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
  RotateCcw,
  BookMarked,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "./lib/auth";

import {
  addBook,
  Book,
  borrowBook,
  deleteBook,
  getBooks,
  getMyBorrows,
  getAllBorrows,
  returnBook,
  updateBook,
  BorrowRecord,
} from "./lib/api";

import AuthPage from "./components/AuthPage";

type Page = "overview" | "library" | "members" | "collections" | "borrows";
type ModalType = "add" | "edit" | "details" | "borrow" | null;

interface BookForm {
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: string;
  availableCopies: string;
}

const emptyForm: BookForm = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  totalCopies: "1",
  availableCopies: "1",
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(dueDate?: string, returnedAt?: string) {
  if (!dueDate || returnedAt) return false;
  return new Date(dueDate) < new Date();
}

const coverColors: Record<string, string> = {
  Fiction: "linear-gradient(135deg,#667eea,#764ba2)",
  "Non-Fiction": "linear-gradient(135deg,#f093fb,#f5576c)",
  Science: "linear-gradient(135deg,#4facfe,#00f2fe)",
  History: "linear-gradient(135deg,#43e97b,#38f9d7)",
  Technology: "linear-gradient(135deg,#fa709a,#fee140)",
  Philosophy: "linear-gradient(135deg,#a8edea,#fed6e3)",
  default: "linear-gradient(135deg,#155e59,#1e7a73)",
};

function getCoverBg(category: string) {
  return coverColors[category] || coverColors.default;
}

export default function App() {
  const { user, session, loading: authLoading, signOut } = useAuth();

  const [page, setPage] = useState<Page>("overview");
  const [books, setBooks] = useState<Book[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [allBorrows, setAllBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All books");
  const [collectionFilter, setCollectionFilter] = useState<"all"|"available"|"borrowed"|"recent">("all");
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [borrowSearch, setBorrowSearch] = useState("");

  const canManageBooks = user?.role === "admin" || user?.role === "librarian";

  async function loadBooks() {
    try { setLoading(true); setBooks(await getBooks() || []); }
    catch (err: any) { setError(err?.message || "Unable to load books."); }
    finally { setLoading(false); }
  }

  async function loadBorrows() {
    try { setBorrows((await getMyBorrows()).data || []); }
    catch { setBorrows([]); }
  }

  async function loadAllBorrows() {
    if (!canManageBooks) return;
    try { setAllBorrows((await getAllBorrows()).data || []); }
    catch { setAllBorrows([]); }
  }

  useEffect(() => {
    if (!session) return;
    loadBooks(); loadBorrows(); loadAllBorrows();
  }, [session]);

  useEffect(() => {
    if (!error && !success) return;
    const t = setTimeout(() => { setError(""); setSuccess(""); }, 4000);
    return () => clearTimeout(t);
  }, [error, success]);

  const categories = useMemo(() => ["All books", ...Array.from(new Set(books.map(b => b.category).filter(Boolean)))], [books]);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter(book => {
      const ms = !q || book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q) || book.category.toLowerCase().includes(q) || book.isbn.toLowerCase().includes(q);
      const mc = category === "All books" || book.category === category;
      let mf = true;
      if (collectionFilter === "available") mf = book.availableCopies > 0;
      else if (collectionFilter === "borrowed") mf = book.availableCopies === 0 && book.totalCopies > 0;
      else if (collectionFilter === "recent") {
        const d = book.createdAt ? new Date(book.createdAt) : null;
        const now = new Date();
        mf = !!d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return ms && mc && mf;
    });
  }, [books, search, category, collectionFilter]);

  const totalBooks = books.length;
  const totalCopies = books.reduce((s, b) => s + (b.totalCopies || 0), 0);
  const availableCopies = books.reduce((s, b) => s + (b.availableCopies || 0), 0);
  const onLoan = Math.max(0, totalCopies - availableCopies);
  const newThisMonth = books.filter(b => { if (!b.createdAt) return false; const d = new Date(b.createdAt); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;

  const filteredAllBorrows = useMemo(() => {
    const q = borrowSearch.trim().toLowerCase();
    if (!q) return allBorrows;
    return allBorrows.filter(b => {
      const bt = typeof b.book === "object" ? (b.book as Book)?.title : "";
      const un = typeof b.user === "object" ? (b.user as any)?.name : "";
      const ue = typeof b.user === "object" ? (b.user as any)?.email : "";
      return bt?.toLowerCase().includes(q) || un?.toLowerCase().includes(q) || ue?.toLowerCase().includes(q);
    });
  }, [allBorrows, borrowSearch]);

  if (authLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#0f2027,#203a43,#2c5364)", color:"white", gap:16 }}>
      <div style={{ width:56,height:56,borderRadius:14,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center" }}><BookOpen size={28}/></div>
      <div style={{ fontSize:18,fontWeight:600 }}>Loading Folio...</div>
    </div>
  );

  if (!user || !session) return <AuthPage />;

  function navigate(p: Page) { setPage(p); setMobileSidebar(false); setProfileOpen(false); }

  function openAddModal() { setForm(emptyForm); setSelectedBook(null); setError(""); setModal("add"); }
  function openEditModal(book: Book) {
    setSelectedBook(book);
    setForm({ title:book.title, author:book.author, isbn:book.isbn, category:book.category, totalCopies:String(book.totalCopies), availableCopies:String(book.availableCopies) });
    setError(""); setModal("edit");
  }
  function openDetails(book: Book) { setSelectedBook(book); setModal("details"); }

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageBooks) { setError("Only admin or librarian can add books."); return; }
    try {
      setLoading(true);
      await addBook({ title:form.title.trim(), author:form.author.trim(), isbn:form.isbn.trim(), category:form.category.trim(), totalCopies:Number(form.totalCopies), availableCopies:Number(form.availableCopies) });
      setModal(null); setSuccess("Book added successfully."); await loadBooks();
    } catch (err: any) { setError(err?.message || "Unable to add the book."); }
    finally { setLoading(false); }
  }

  async function handleEditBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook || !canManageBooks) return;
    try {
      setLoading(true);
      await updateBook(selectedBook._id, { title:form.title.trim(), author:form.author.trim(), isbn:form.isbn.trim(), category:form.category.trim(), totalCopies:Number(form.totalCopies), availableCopies:Number(form.availableCopies) });
      setModal(null); setSuccess("Book updated successfully."); await loadBooks();
    } catch (err: any) { setError(err?.message || "Unable to update the book."); }
    finally { setLoading(false); }
  }

  async function handleDeleteBook(book: Book) {
    if (!canManageBooks) { setError("Only admin or librarian can delete books."); return; }
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    try {
      setLoading(true); await deleteBook(book._id); setSuccess("Book deleted successfully.");
      if (selectedBook?._id === book._id) { setSelectedBook(null); setModal(null); }
      await loadBooks();
    } catch (err: any) { setError(err?.message || "Unable to delete the book."); }
    finally { setLoading(false); }
  }

  async function handleBorrow(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook || !dueDate) { setError("Please select a due date."); return; }
    try {
      setLoading(true); await borrowBook(selectedBook._id, dueDate);
      setModal(null); setSuccess(`"${selectedBook.title}" borrowed successfully.`);
      await loadBooks(); await loadBorrows(); await loadAllBorrows();
    } catch (err: any) { setError(err?.message || "Unable to borrow this book."); }
    finally { setLoading(false); }
  }

  async function handleReturn(borrow: BorrowRecord) {
    try {
      setLoading(true); await returnBook(borrow._id); setSuccess("Book returned successfully.");
      await loadBooks(); await loadBorrows(); await loadAllBorrows();
    } catch (err: any) { setError(err?.message || "Unable to return the book."); }
    finally { setLoading(false); }
  }

  function getBorrowBook(borrow: BorrowRecord): Book | null {
    if (borrow.book && typeof borrow.book !== "string") return borrow.book;
    if (borrow.bookId && typeof borrow.bookId !== "string") return borrow.bookId;
    if (typeof borrow.bookId === "string") return books.find(b => b._id === borrow.bookId) || null;
    return null;
  }

  const pageTitle = page === "overview" ? "Overview" : page === "library" ? "My Library" : page === "members" ? "Members" : page === "borrows" ? "Borrow Activity" : "Collections";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const activeBorrowCount = allBorrows.filter(b => !b.returnedAt && b.status !== "returned").length;

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"#f0f4f3", color:"#173f3b" }}>
      {mobileSidebar && <div onClick={() => setMobileSidebar(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:20, backdropFilter:"blur(2px)" }} />}

      {/* SIDEBAR */}
      <aside style={{
        width:268, background:"linear-gradient(180deg,#0d3330,#0f3d3a)",
        minHeight:"100vh", position:"fixed", left:0, top:0, bottom:0,
        transform: mobileSidebar || window.innerWidth > 800 ? "translateX(0)" : "translateX(-100%)",
        zIndex:30, transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxSizing:"border-box", display:"flex", flexDirection:"column",
        boxShadow:"4px 0 24px rgba(0,0,0,0.15)",
      }}>
        {/* Logo */}
        <div style={{ padding:"28px 20px 24px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#14b8a6,#0d9488)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(20,184,166,0.4)" }}>
              <BookOpen size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:"white", letterSpacing:"-0.8px" }}>folio</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:1.5, textTransform:"uppercase" }}>Library System</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ padding:"16px 12px", flex:1, overflowY:"auto" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:1.8, marginBottom:8, padding:"0 8px" }}>WORKSPACE</div>
          <SidebarButton icon={<Grid2X2 size={18}/>} label="Overview" active={page==="overview"} onClick={() => navigate("overview")} />
          <SidebarButton icon={<BookMarked size={18}/>} label="My Library" active={page==="library"} onClick={() => navigate("library")} />
          {canManageBooks && <SidebarButton icon={<Users size={18}/>} label="Members" active={page==="members"} onClick={() => navigate("members")} />}
          {canManageBooks && <SidebarButton icon={<BarChart3 size={18}/>} label="Borrow Activity" active={page==="borrows"} onClick={() => navigate("borrows")} badge={activeBorrowCount || undefined} />}

          <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:1.8, marginBottom:8, padding:"8px 8px 0", marginTop:20 }}>YOUR COLLECTIONS</div>
          <CollectionLink dot="#14b8a6" label="All books" count={books.length} active={page==="collections" && collectionFilter==="all"} onClick={() => { setCollectionFilter("all"); setSearch(""); setCategory("All books"); navigate("collections"); }} />
          <CollectionLink dot="#34d399" label="Available now" count={books.filter(b=>b.availableCopies>0).length} active={page==="collections" && collectionFilter==="available"} onClick={() => { setCollectionFilter("available"); setSearch(""); setCategory("All books"); navigate("collections"); }} />
          <CollectionLink dot="#f59e0b" label="On loan" count={books.filter(b=>b.availableCopies===0&&b.totalCopies>0).length} active={page==="collections" && collectionFilter==="borrowed"} onClick={() => { setCollectionFilter("borrowed"); setSearch(""); setCategory("All books"); navigate("collections"); }} />
          <CollectionLink dot="#a78bfa" label="Recently added" count={newThisMonth} active={page==="collections" && collectionFilter==="recent"} onClick={() => { setCollectionFilter("recent"); setSearch(""); setCategory("All books"); navigate("collections"); }} />
        </div>

        {/* User info */}
        <div style={{ padding:"12px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{getInitials(user.name)}</div>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"white", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"capitalize" }}>{user.role}</div>
            </div>
            <button onClick={signOut} title="Sign out" style={{ border:0, background:"transparent", cursor:"pointer", color:"rgba(255,255,255,0.3)", padding:4, display:"flex", alignItems:"center" }}><LogOut size={15}/></button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: window.innerWidth > 800 ? 268 : 0, width:"100%", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <header style={{ height:70, borderBottom:"1px solid rgba(0,0,0,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", background:"rgba(255,255,255,0.9)", backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:10, boxSizing:"border-box" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => setMobileSidebar(true)} style={{ display:"none", border:0, background:"transparent", cursor:"pointer" }}><Menu size={22}/></button>
            <span style={{ color:"#9aaba7", fontSize:13 }}>Workspace</span>
            <span style={{ color:"#d1d9d7" }}>/</span>
            <span style={{ fontSize:13, fontWeight:700 }}>{pageTitle}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16, position:"relative" }}>
            {canManageBooks && page === "collections" && (
              <button onClick={openAddModal} style={{ border:0, borderRadius:9, background:"linear-gradient(135deg,#155e59,#0d9488)", color:"white", padding:"9px 16px", display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontWeight:700, fontSize:13, boxShadow:"0 4px 12px rgba(21,94,89,0.35)" }}>
                <Plus size={16}/> Add book
              </button>
            )}
            <button onClick={() => setProfileOpen(!profileOpen)} style={{ border:0, background:"transparent", padding:0, cursor:"pointer" }}>
              <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>{getInitials(user.name)}</div>
            </button>
            {profileOpen && (
              <div style={{ position:"absolute", right:0, top:50, width:250, background:"white", border:"1px solid rgba(0,0,0,0.08)", borderRadius:16, boxShadow:"0 20px 60px rgba(0,0,0,0.15)", padding:8, zIndex:50 }}>
                <div style={{ padding:"14px 14px 16px", borderBottom:"1px solid #f0f4f3" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                    <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700 }}>{getInitials(user.name)}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{user.name}</div>
                      <div style={{ color:"#81918e", fontSize:12, marginTop:2 }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, background:"#e7f5f0", color:"#155e59", fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{user.role}</div>
                </div>
                <button onClick={() => { navigate("library"); setProfileOpen(false); }} style={menuBtnStyle}><BookMarked size={15}/> My borrowed books</button>
                <button onClick={() => { setProfileOpen(false); signOut(); }} style={{ ...menuBtnStyle, color:"#dc2626" }}><LogOut size={15}/> Sign out</button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding:"40px 5%", maxWidth:1400, margin:"0 auto", width:"100%", boxSizing:"border-box", flex:1 }}>
          {error && <AlertBar type="error" message={error} onClose={() => setError("")} />}
          {success && <AlertBar type="success" message={success} onClose={() => setSuccess("")} />}

          {page === "overview" && (
            <OverviewPage
              greeting={greeting} userName={user.name} totalBooks={totalBooks} totalCopies={totalCopies}
              availableCopies={availableCopies} onLoan={onLoan} newThisMonth={newThisMonth}
              borrows={borrows} allBorrows={allBorrows} canManageBooks={canManageBooks}
              onCollections={() => navigate("collections")} onAddBook={openAddModal}
              onBorrowActivity={() => navigate("borrows")}
            />
          )}
          {page === "library" && (
            <MyLibraryPage borrows={borrows} getBorrowBook={getBorrowBook} onReturn={handleReturn} onCollections={() => navigate("collections")} />
          )}
          {page === "members" && canManageBooks && <MembersPage allBorrows={allBorrows} />}
          {page === "borrows" && canManageBooks && (
            <BorrowActivityPage allBorrows={filteredAllBorrows} borrowSearch={borrowSearch} setBorrowSearch={setBorrowSearch} onReturn={handleReturn} />
          )}

          {page === "collections" && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:20, flexWrap:"wrap", marginBottom:36 }}>
                <div>
                  <div style={{ color:"#14b8a6", fontSize:12, fontWeight:700, marginBottom:12, letterSpacing:1 }}>
                    ✦ {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
                  </div>
                  <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(32px,3.5vw,48px)", lineHeight:1.1, margin:0, letterSpacing:"-1.5px", color:"#0f2d2a" }}>
                    {greeting}, {user.name.split(" ")[0]}.
                  </h1>
                  <p style={{ color:"#81918e", marginTop:10, fontSize:15 }}>
                    {collectionFilter === "all" && "Explore and manage your complete library collection."}
                    {collectionFilter === "available" && "Books that are currently available to borrow."}
                    {collectionFilter === "borrowed" && "Books that are fully on loan."}
                    {collectionFilter === "recent" && "Books added to the library this month."}
                  </p>
                </div>
              </div>

              {collectionFilter !== "all" && (
                <div style={{ display:"flex", marginBottom:20 }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:20, background:"#e7f5f0", border:"1px solid #b2ddd4", color:"#155e59", fontSize:13, fontWeight:600 }}>
                    Filter: {collectionFilter === "available" ? "Available now" : collectionFilter === "borrowed" ? "On loan" : "Recently added"}
                    <button onClick={() => setCollectionFilter("all")} style={{ border:0, background:"transparent", cursor:"pointer", color:"#155e59", padding:0, display:"flex" }}><X size={14}/></button>
                  </div>
                </div>
              )}

              <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
                <div style={{ flex:"1 1 350px", display:"flex", alignItems:"center", border:"1px solid rgba(0,0,0,0.08)", borderRadius:12, background:"white", padding:"0 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
                  <Search size={18} color="#9aaba7" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, author, category or ISBN"
                    style={{ flex:1, border:0, outline:0, padding:"13px 10px", fontSize:14, background:"transparent" }} />
                  {search && <button onClick={() => setSearch("")} style={{ border:0, background:"transparent", cursor:"pointer", color:"#9aaba7", display:"flex" }}><X size={16}/></button>}
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  style={{ border:"1px solid rgba(0,0,0,0.08)", borderRadius:12, background:"white", padding:"0 16px", minWidth:160, color:"#49625e", fontSize:14, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", cursor:"pointer" }}>
                  {categories.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div style={{ marginBottom:16, color:"#81918e", fontSize:13 }}>{filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"} found</div>

              {loading && books.length === 0 ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:20 }}>
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ background:"white", borderRadius:18, overflow:"hidden", border:"1px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ height:175, background:"#f0f4f3" }} />
                      <div style={{ padding:16 }}><div style={{ height:12, background:"#f0f4f3", borderRadius:6, marginBottom:8, width:"70%" }}/></div>
                    </div>
                  ))}
                </div>
              ) : filteredBooks.length === 0 ? (
                <div style={{ background:"white", border:"1px solid rgba(0,0,0,0.06)", borderRadius:18, padding:"70px 40px", textAlign:"center" }}>
                  <div style={{ width:72, height:72, borderRadius:20, background:"#e6f4f1", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}><BookOpen size={34} color="#155e59"/></div>
                  <h3 style={{ margin:"0 0 10px", color:"#0f2d2a" }}>No books found</h3>
                  <p style={{ color:"#81918e", margin:"0 0 20px" }}>Try changing your search or category filter.</p>
                  {canManageBooks && <button onClick={openAddModal} style={primaryBtnStyle}>Add a book</button>}
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:20 }}>
                  {filteredBooks.map(book => (
                    <BookCard key={book._id} book={book} canManageBooks={canManageBooks}
                      onClick={() => openDetails(book)} onEdit={() => openEditModal(book)} onDelete={() => handleDeleteBook(book)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {modal === "add" && <BookFormModal title="Add a new book" form={form} setForm={setForm} loading={loading} onClose={() => setModal(null)} onSubmit={handleAddBook} submitText="Add book" />}
      {modal === "edit" && selectedBook && <BookFormModal title="Edit book" form={form} setForm={setForm} loading={loading} onClose={() => setModal(null)} onSubmit={handleEditBook} submitText="Save changes" />}
      {modal === "details" && selectedBook && (
        <BookDetailsModal book={selectedBook} canManageBooks={canManageBooks} onClose={() => setModal(null)}
          onEdit={() => openEditModal(selectedBook)} onDelete={() => handleDeleteBook(selectedBook)}
          onBorrow={() => { setDueDate(""); setModal("borrow"); }} />
      )}
      {modal === "borrow" && selectedBook && (
        <BorrowModal book={selectedBook} dueDate={dueDate} setDueDate={setDueDate} loading={loading} onClose={() => setModal("details")} onSubmit={handleBorrow} />
      )}
    </div>
  );
}

// ─── Sidebar Button ────────────────────────────────────────────────────────────
function SidebarButton({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} style={{ width:"100%", border:0, borderRadius:10, background:active?"rgba(20,184,166,0.18)":"transparent", color:active?"#5eead4":"rgba(255,255,255,0.55)", display:"flex", alignItems:"center", gap:12, padding:"11px 12px", marginBottom:2, cursor:"pointer", textAlign:"left", fontSize:14, fontWeight:active?700:500, position:"relative" }}>
      {active && <div style={{ position:"absolute", left:0, top:"20%", bottom:"20%", width:3, borderRadius:"0 2px 2px 0", background:"linear-gradient(180deg,#14b8a6,#0d9488)" }} />}
      {icon}
      <span style={{ flex:1 }}>{label}</span>
      {badge !== undefined && badge > 0 && <span style={{ background:"#ef4444", color:"white", borderRadius:10, fontSize:10, fontWeight:700, padding:"2px 6px" }}>{badge}</span>}
    </button>
  );
}

// ─── Collection Link ────────────────────────────────────────────────────────────
function CollectionLink({ dot, label, count, active, onClick }: { dot: string; label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width:"100%", border:0, background:active?"rgba(255,255,255,0.06)":"transparent", display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, color:active?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.45)", cursor:"pointer", textAlign:"left", fontSize:13, fontWeight:active?600:400, marginBottom:2 }}>
      <span style={{ width:8, height:8, borderRadius:"50%", background:dot, flexShrink:0 }} />
      <span style={{ flex:1 }}>{label}</span>
      <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>{count}</span>
    </button>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats({ totalBooks, totalCopies, onLoan, availableCopies, newThisMonth }: { totalBooks:number; totalCopies:number; onLoan:number; availableCopies:number; newThisMonth:number }) {
  const cards = [
    { label:"Total titles", value:totalBooks, sub:`${totalCopies} total copies`, icon:<BookOpen size={19}/>, light:"#e6f4f1" },
    { label:"On loan", value:onLoan, sub:"Copies checked out", icon:<Clock3 size={19}/>, light:"#fef3c7" },
    { label:"Available", value:availableCopies, sub:"Ready to borrow", icon:<CheckCircle2 size={19}/>, light:"#d1fae5" },
    { label:"New this month", value:newThisMonth, sub:"Recently added", icon:<TrendingUp size={19}/>, light:"#ede9fe" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:16 }}>
      {cards.map(card => (
        <div key={card.label} style={{ background:"white", borderRadius:16, padding:"20px 22px", border:"1px solid rgba(0,0,0,0.06)", boxShadow:"0 2px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:12, color:"#81918e", fontWeight:600 }}>{card.label}</div>
              <div style={{ fontSize:34, fontWeight:800, marginTop:6, letterSpacing:"-1px", color:"#0f2d2a" }}>{card.value}</div>
              <div style={{ fontSize:12, color:"#9aaba7", marginTop:4 }}>{card.sub}</div>
            </div>
            <div style={{ width:44, height:44, borderRadius:12, background:card.light, display:"flex", alignItems:"center", justifyContent:"center", color:"#155e59" }}>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Book Card ────────────────────────────────────────────────────────────────
function BookCard({ book, canManageBooks, onClick, onEdit, onDelete }: { book:Book; canManageBooks:boolean; onClick:()=>void; onEdit:()=>void; onDelete:()=>void }) {
  const available = book.availableCopies > 0;
  const bg = getCoverBg(book.category);
  return (
    <div style={{ background:"white", borderRadius:18, overflow:"hidden", cursor:"pointer", border:"1px solid rgba(0,0,0,0.06)", boxShadow:"0 2px 12px rgba(0,0,0,0.05)", transition:"transform 0.2s,box-shadow 0.2s" }}
      onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform="translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow="0 12px 32px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform="translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow="0 2px 12px rgba(0,0,0,0.05)"; }}
    >
      <div style={{ height:175, background:bg, padding:"20px 22px", position:"relative", display:"flex", flexDirection:"column", justifyContent:"space-between", overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <div style={{ fontSize:9, letterSpacing:2, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase" }}>{book.category || "Library"}</div>
          <div style={{ padding:"3px 8px", borderRadius:20, background:available?"rgba(52,211,153,0.25)":"rgba(245,158,11,0.25)", color:available?"#d1fae5":"#fef3c7", fontSize:10, fontWeight:700, border:`1px solid ${available?"rgba(52,211,153,0.4)":"rgba(245,158,11,0.4)"}` }}>
            {available ? `${book.availableCopies} avail.` : "On loan"}
          </div>
        </div>
        <div>
          <div style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:"white", lineHeight:1.2, marginBottom:6 }}>{book.title.length>38?book.title.slice(0,38)+"…":book.title}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{book.author}</div>
        </div>
        <div style={{ position:"absolute", right:-20, bottom:-20, width:90, height:90, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
        <div style={{ position:"absolute", right:14, bottom:14, fontFamily:"Georgia,serif", fontSize:40, color:"rgba(255,255,255,0.12)", fontWeight:700 }}>{getInitials(book.title)}</div>
      </div>
      <div style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:13, color:"#5e7a75", fontWeight:500 }}>{book.isbn ? `ISBN ${book.isbn}` : book.category}</div>
        <div style={{ display:"flex", gap:6 }} onClick={e => e.stopPropagation()}>
          {canManageBooks && <>
            <button onClick={onEdit} title="Edit" style={iconBtnStyle}><Edit3 size={14}/></button>
            <button onClick={onDelete} title="Delete" style={{ ...iconBtnStyle, color:"#ef4444", background:"#fef2f2" }}><Trash2 size={14}/></button>
          </>}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Page ────────────────────────────────────────────────────────────
function OverviewPage({ greeting, userName, totalBooks, totalCopies, availableCopies, onLoan, newThisMonth, borrows, allBorrows, canManageBooks, onCollections, onAddBook, onBorrowActivity }: {
  greeting:string; userName:string; totalBooks:number; totalCopies:number; availableCopies:number; onLoan:number; newThisMonth:number;
  borrows:BorrowRecord[]; allBorrows:BorrowRecord[]; canManageBooks:boolean; onCollections:()=>void; onAddBook:()=>void; onBorrowActivity:()=>void;
}) {
  const activeBorrows = borrows.filter(b => !b.returnedAt && b.status !== "returned");
  const overdueBorrows = borrows.filter(b => isOverdue(b.dueDate, b.returnedAt));
  return (
    <>
      <div style={{ marginBottom:36 }}>
        <div style={{ color:"#14b8a6", fontSize:12, fontWeight:700, marginBottom:10, letterSpacing:1 }}>✦ Library overview</div>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(32px,3.5vw,52px)", margin:0, letterSpacing:"-1.5px", color:"#0f2d2a" }}>{greeting}, {userName.split(" ")[0]}.</h1>
        <p style={{ color:"#81918e", marginTop:10, fontSize:15 }}>Here's the current state of your digital library.</p>
      </div>
      <Stats totalBooks={totalBooks} totalCopies={totalCopies} availableCopies={availableCopies} onLoan={onLoan} newThisMonth={newThisMonth} />
      <div style={{ marginTop:32, marginBottom:32 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:"#0f2d2a", margin:"0 0 16px" }}>Quick actions</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
          <ActionCard icon={<Library size={20}/>} title="Browse collection" text="View all books" onClick={onCollections} color="#155e59" light="#e6f4f1" />
          {canManageBooks && <ActionCard icon={<Plus size={20}/>} title="Add a book" text="New entry" onClick={onAddBook} color="#7c3aed" light="#ede9fe" />}
          {canManageBooks && <ActionCard icon={<BarChart3 size={20}/>} title="Borrow activity" text="See all borrows" onClick={onBorrowActivity} color="#d97706" light="#fef3c7" />}
        </div>
      </div>
      {!canManageBooks && activeBorrows.length > 0 && (
        <div style={{ marginTop:32 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:"#0f2d2a", margin:"0 0 16px" }}>
            Your active borrows
            {overdueBorrows.length > 0 && <span style={{ marginLeft:10, padding:"2px 8px", borderRadius:20, background:"#fef2f2", color:"#dc2626", fontSize:12 }}>{overdueBorrows.length} overdue</span>}
          </h2>
          <div style={{ display:"grid", gap:12 }}>{activeBorrows.slice(0,3).map(b => <BorrowRow key={b._id} borrow={b} showUser={false} />)}</div>
        </div>
      )}
      {canManageBooks && allBorrows.length > 0 && (
        <div style={{ marginTop:32 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:"#0f2d2a", margin:0 }}>Recent borrow activity</h2>
            <button onClick={onBorrowActivity} style={{ border:0, background:"transparent", color:"#14b8a6", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>View all <ArrowRight size={14}/></button>
          </div>
          <div style={{ display:"grid", gap:10 }}>{allBorrows.slice(0,5).map(b => <BorrowRow key={b._id} borrow={b} showUser={true} />)}</div>
        </div>
      )}
    </>
  );
}

// ─── Borrow Row ───────────────────────────────────────────────────────────────
function BorrowRow({ borrow, showUser, onReturn }: { borrow:BorrowRecord; showUser:boolean; onReturn?:(b:BorrowRecord)=>void }) {
  const book = borrow.book && typeof borrow.book !== "string" ? borrow.book as Book : null;
  const borrowUser = borrow.user && typeof borrow.user !== "string" ? borrow.user as any : null;
  const returned = !!borrow.returnedAt || borrow.status === "returned";
  const overdue = isOverdue(borrow.dueDate, borrow.returnedAt);
  return (
    <div style={{ background:"white", borderRadius:12, padding:"14px 18px", border:`1px solid ${overdue&&!returned?"#fee2e2":"rgba(0,0,0,0.06)"}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14, flex:1, minWidth:0 }}>
        <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:overdue&&!returned?"#fee2e2":"#e6f4f1", display:"flex", alignItems:"center", justifyContent:"center", color:overdue&&!returned?"#dc2626":"#155e59" }}><BookOpen size={18}/></div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#0f2d2a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{book?.title || "Unknown book"}</div>
          {showUser && borrowUser && <div style={{ fontSize:12, color:"#81918e", marginTop:2 }}>👤 {borrowUser.name} · {borrowUser.email}</div>}
          <div style={{ fontSize:12, color:overdue&&!returned?"#dc2626":"#81918e", marginTop:2 }}>
            {returned ? `✓ Returned ${formatDate(borrow.returnedAt)}` : `Due ${formatDate(borrow.dueDate)}`}
            {overdue&&!returned && " · Overdue!"}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:returned?"#d1fae5":overdue?"#fee2e2":"#fef3c7", color:returned?"#059669":overdue?"#dc2626":"#d97706" }}>
          {returned?"Returned":overdue?"Overdue":"Active"}
        </span>
        {!returned && onReturn && (
          <button onClick={() => onReturn(borrow)} style={{ border:0, borderRadius:8, background:"#155e59", color:"white", padding:"7px 12px", cursor:"pointer", display:"flex", gap:6, alignItems:"center", fontWeight:600, fontSize:12 }}><RotateCcw size={13}/> Return</button>
        )}
      </div>
    </div>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────
function ActionCard({ icon, title, text, onClick, color, light }: { icon:React.ReactNode; title:string; text:string; onClick:()=>void; color:string; light:string }) {
  return (
    <button onClick={onClick} style={{ background:"white", border:"1px solid rgba(0,0,0,0.06)", borderRadius:14, padding:"20px 22px", textAlign:"left", cursor:"pointer", color:"#173f3b", boxShadow:"0 2px 10px rgba(0,0,0,0.04)", transition:"all 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow="0 8px 24px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform="translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow="0 2px 10px rgba(0,0,0,0.04)"; }}
    >
      <div style={{ width:44, height:44, borderRadius:11, background:light, display:"flex", alignItems:"center", justifyContent:"center", color, marginBottom:14 }}>{icon}</div>
      <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{title}</div>
      <div style={{ color:"#81918e", fontSize:13 }}>{text}</div>
    </button>
  );
}

// ─── My Library Page ──────────────────────────────────────────────────────────
function MyLibraryPage({ borrows, getBorrowBook, onReturn, onCollections }: { borrows:BorrowRecord[]; getBorrowBook:(b:BorrowRecord)=>Book|null; onReturn:(b:BorrowRecord)=>void; onCollections:()=>void }) {
  const active = borrows.filter(b => !b.returnedAt && b.status !== "returned");
  const returned = borrows.filter(b => !!b.returnedAt || b.status === "returned");
  return (
    <>
      <div style={{ marginBottom:36 }}>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(30px,3.5vw,46px)", margin:0, color:"#0f2d2a", letterSpacing:"-1px" }}>My Library</h1>
        <p style={{ color:"#81918e", marginTop:10, fontSize:15 }}>Books you have borrowed — {active.length} active, {returned.length} returned.</p>
      </div>
      {borrows.length === 0 ? (
        <div style={{ background:"white", border:"1px solid rgba(0,0,0,0.06)", borderRadius:18, padding:"60px 40px", textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:20, background:"#e6f4f1", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}><BookMarked size={34} color="#155e59"/></div>
          <h3 style={{ margin:"0 0 10px", color:"#0f2d2a" }}>No borrowed books</h3>
          <p style={{ color:"#81918e", margin:"0 0 20px" }}>You haven't borrowed any books yet.</p>
          <button onClick={onCollections} style={primaryBtnStyle}>Browse books</button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:"#0f2d2a", margin:"0 0 14px" }}>Active borrows ({active.length})</h2>
              <div style={{ display:"grid", gap:12 }}>
                {active.map(borrow => {
                  const book = getBorrowBook(borrow);
                  const overdue = isOverdue(borrow.dueDate, borrow.returnedAt);
                  return (
                    <div key={borrow._id} style={{ background:"white", border:`1px solid ${overdue?"#fee2e2":"rgba(0,0,0,0.06)"}`, borderRadius:14, padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:20, flexWrap:"wrap" }}>
                      <div style={{ display:"flex", gap:14, alignItems:"center", flex:1, minWidth:0 }}>
                        <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, background:overdue?"#fee2e2":"#e6f4f1", display:"flex", alignItems:"center", justifyContent:"center", color:overdue?"#dc2626":"#155e59" }}><BookOpen size={20}/></div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:15, color:"#0f2d2a" }}>{book?.title || "Borrowed book"}</div>
                          <div style={{ color:"#81918e", fontSize:13, marginTop:3 }}>{book?.author}</div>
                          <div style={{ fontSize:12, marginTop:5, fontWeight:600, color:overdue?"#dc2626":"#81918e" }}>{overdue?"⚠️ Overdue · ":"Due: "}{formatDate(borrow.dueDate)}</div>
                        </div>
                      </div>
                      <button onClick={() => onReturn(borrow)} style={primaryBtnStyle}><RotateCcw size={15}/> Return</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {returned.length > 0 && (
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:"#0f2d2a", margin:"0 0 14px" }}>Returned ({returned.length})</h2>
              <div style={{ display:"grid", gap:10 }}>
                {returned.map(borrow => {
                  const book = getBorrowBook(borrow);
                  return (
                    <div key={borrow._id} style={{ background:"#fafcfb", border:"1px solid rgba(0,0,0,0.05)", borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:38, height:38, borderRadius:9, flexShrink:0, background:"#d1fae5", display:"flex", alignItems:"center", justifyContent:"center", color:"#059669" }}><CheckCircle2 size={18}/></div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:14, color:"#0f2d2a" }}>{book?.title || "Book"}</div>
                        <div style={{ fontSize:12, color:"#9aaba7", marginTop:2 }}>Returned {formatDate(borrow.returnedAt)}</div>
                      </div>
                      <span style={{ padding:"3px 10px", borderRadius:20, background:"#d1fae5", color:"#059669", fontSize:11, fontWeight:700 }}>Returned</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── Borrow Activity Page ─────────────────────────────────────────────────────
function BorrowActivityPage({ allBorrows, borrowSearch, setBorrowSearch, onReturn }: { allBorrows:BorrowRecord[]; borrowSearch:string; setBorrowSearch:(s:string)=>void; onReturn:(b:BorrowRecord)=>void }) {
  const active = allBorrows.filter(b => !b.returnedAt && b.status !== "returned");
  const returned = allBorrows.filter(b => !!b.returnedAt || b.status === "returned");
  const overdue = active.filter(b => isOverdue(b.dueDate));
  return (
    <>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(30px,3.5vw,46px)", margin:0, color:"#0f2d2a", letterSpacing:"-1px" }}>Borrow Activity</h1>
        <p style={{ color:"#81918e", marginTop:10, fontSize:15 }}>All borrow records across all members.</p>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        <div style={{ padding:"8px 16px", borderRadius:20, background:"#fef3c7", color:"#d97706", fontWeight:700, fontSize:13 }}>📚 {active.length} active</div>
        {overdue.length > 0 && <div style={{ padding:"8px 16px", borderRadius:20, background:"#fee2e2", color:"#dc2626", fontWeight:700, fontSize:13 }}>⚠️ {overdue.length} overdue</div>}
        <div style={{ padding:"8px 16px", borderRadius:20, background:"#d1fae5", color:"#059669", fontWeight:700, fontSize:13 }}>✓ {returned.length} returned</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", border:"1px solid rgba(0,0,0,0.08)", borderRadius:12, background:"white", padding:"0 14px", marginBottom:24, maxWidth:480 }}>
        <Search size={18} color="#9aaba7"/>
        <input value={borrowSearch} onChange={e => setBorrowSearch(e.target.value)} placeholder="Search by book title or member name..."
          style={{ flex:1, border:0, outline:0, padding:"13px 10px", fontSize:14, background:"transparent" }} />
      </div>
      {allBorrows.length === 0 ? (
        <div style={{ background:"white", borderRadius:16, padding:"60px 40px", textAlign:"center", border:"1px solid rgba(0,0,0,0.06)" }}>
          <BookCopy size={40} color="#9aaba7" style={{ marginBottom:16 }}/>
          <h3 style={{ color:"#0f2d2a", margin:"0 0 8px" }}>No borrow records</h3>
          <p style={{ color:"#81918e" }}>No one has borrowed a book yet.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gap:10 }}>
          {allBorrows.map(borrow => {
            const book = borrow.book && typeof borrow.book !== "string" ? borrow.book as Book : null;
            const borrowUser = borrow.user && typeof borrow.user !== "string" ? borrow.user as any : null;
            const isRet = !!borrow.returnedAt || borrow.status === "returned";
            const isOvr = isOverdue(borrow.dueDate, borrow.returnedAt);
            return (
              <div key={borrow._id} style={{ background:"white", borderRadius:13, padding:"16px 20px", border:`1px solid ${isOvr&&!isRet?"#fecaca":"rgba(0,0,0,0.06)"}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display:"flex", gap:14, flex:1, minWidth:0 }}>
                  <div style={{ width:46, height:46, borderRadius:11, flexShrink:0, background:isOvr&&!isRet?"#fee2e2":isRet?"#d1fae5":"#e6f4f1", display:"flex", alignItems:"center", justifyContent:"center", color:isOvr&&!isRet?"#dc2626":isRet?"#059669":"#155e59" }}><BookOpen size={20}/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:"#0f2d2a" }}>{book?.title || "Unknown book"}</div>
                    {book?.author && <div style={{ fontSize:12, color:"#9aaba7", marginTop:1 }}>by {book.author}</div>}
                    {borrowUser && (
                      <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:6, padding:"3px 10px", borderRadius:20, background:"#f0f4f3", fontSize:12, fontWeight:600, color:"#426058" }}>
                        <User size={11}/> {borrowUser.name} <span style={{ color:"#9aaba7", fontWeight:400 }}>· {borrowUser.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, color:"#9aaba7" }}>{isRet?"Returned":"Due"} <span style={{ fontWeight:700, color:isOvr&&!isRet?"#dc2626":"#0f2d2a" }}>{isRet?formatDate(borrow.returnedAt):formatDate(borrow.dueDate)}</span></div>
                    <div style={{ fontSize:11, color:"#b5c0be", marginTop:2 }}>Borrowed {formatDate((borrow as any).createdAt)}</div>
                  </div>
                  <span style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:"nowrap", background:isRet?"#d1fae5":isOvr?"#fee2e2":"#fef3c7", color:isRet?"#059669":isOvr?"#dc2626":"#d97706" }}>
                    {isRet?"Returned":isOvr?"Overdue":"Active"}
                  </span>
                  {!isRet && (
                    <button onClick={() => onReturn(borrow)} style={primaryBtnStyle}><RotateCcw size={13}/> Return</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Members Page ─────────────────────────────────────────────────────────────
function MembersPage({ allBorrows }: { allBorrows:BorrowRecord[] }) {
  const membersMap = new Map<string, { id:string; name:string; email:string; role:string; borrows:BorrowRecord[] }>();
  allBorrows.forEach(b => {
    if (b.user && typeof b.user === "object") {
      const u = b.user as any;
      const id = u._id || u.id;
      if (!membersMap.has(id)) membersMap.set(id, { id, name:u.name, email:u.email, role:u.role||"member", borrows:[] });
      membersMap.get(id)!.borrows.push(b);
    }
  });
  const members = Array.from(membersMap.values());
  const avatarColors = ["#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

  return (
    <>
      <div style={{ marginBottom:36 }}>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(30px,3.5vw,46px)", margin:0, color:"#0f2d2a", letterSpacing:"-1px" }}>Members</h1>
        <p style={{ color:"#81918e", marginTop:10, fontSize:15 }}>{members.length > 0 ? `${members.length} member${members.length>1?"s":""} with borrow activity.` : "Members who have borrowed books will appear here."}</p>
      </div>
      {members.length === 0 ? (
        <div style={{ background:"white", borderRadius:18, padding:"60px 40px", textAlign:"center", border:"1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ width:72, height:72, borderRadius:20, background:"#e6f4f1", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}><Users size={32} color="#155e59"/></div>
          <h3 style={{ margin:"0 0 8px", color:"#0f2d2a" }}>No member activity yet</h3>
          <p style={{ color:"#81918e", margin:0 }}>Members who borrow books will appear here.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gap:14 }}>
          {members.map(member => {
            const active = member.borrows.filter(b => !b.returnedAt && b.status !== "returned");
            const ret = member.borrows.filter(b => !!b.returnedAt || b.status === "returned");
            const color = avatarColors[member.name.charCodeAt(0) % avatarColors.length];
            return (
              <div key={member.id} style={{ background:"white", borderRadius:16, border:"1px solid rgba(0,0,0,0.06)", boxShadow:"0 2px 10px rgba(0,0,0,0.04)", overflow:"hidden" }}>
                <div style={{ padding:"18px 22px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                  <div style={{ width:50, height:50, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${color},${color}cc)`, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800 }}>{getInitials(member.name)}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:16, color:"#0f2d2a" }}>{member.name}</div>
                    <div style={{ fontSize:13, color:"#81918e", marginTop:2 }}>{member.email}</div>
                    <div style={{ display:"inline-block", marginTop:6, padding:"2px 8px", borderRadius:20, background:"#e6f4f1", color:"#155e59", fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{member.role}</div>
                  </div>
                  <div style={{ display:"flex", gap:20, textAlign:"center", flexShrink:0 }}>
                    <div><div style={{ fontSize:24, fontWeight:800, color:"#0f2d2a" }}>{member.borrows.length}</div><div style={{ fontSize:11, color:"#9aaba7" }}>Total</div></div>
                    <div><div style={{ fontSize:24, fontWeight:800, color:active.length>0?"#d97706":"#059669" }}>{active.length}</div><div style={{ fontSize:11, color:"#9aaba7" }}>Active</div></div>
                    <div><div style={{ fontSize:24, fontWeight:800, color:"#059669" }}>{ret.length}</div><div style={{ fontSize:11, color:"#9aaba7" }}>Returned</div></div>
                  </div>
                </div>
                {member.borrows.length > 0 && (
                  <div style={{ borderTop:"1px solid rgba(0,0,0,0.05)", padding:"12px 22px", background:"#fafcfb" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#9aaba7", marginBottom:8, letterSpacing:0.5 }}>RECENT BORROWS</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {member.borrows.slice(0,4).map(b => {
                        const book = b.book && typeof b.book !== "string" ? b.book as Book : null;
                        const isAct = !b.returnedAt && b.status !== "returned";
                        return <div key={b._id} style={{ padding:"4px 12px", borderRadius:20, background:isAct?"#fef3c7":"#f0f4f3", color:isAct?"#d97706":"#426058", fontSize:12, fontWeight:600 }}>{book?.title||"Book"}{isAct?" 📖":""}</div>;
                      })}
                      {member.borrows.length > 4 && <div style={{ padding:"4px 12px", borderRadius:20, background:"#f0f4f3", color:"#81918e", fontSize:12 }}>+{member.borrows.length-4} more</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Book Form Modal ──────────────────────────────────────────────────────────
function BookFormModal({ title, form, setForm, loading, onClose, onSubmit, submitText }: { title:string; form:BookForm; setForm:React.Dispatch<React.SetStateAction<BookForm>>; loading:boolean; onClose:()=>void; onSubmit:(e:React.FormEvent)=>void; submitText:string }) {
  const upd = (k: keyof BookForm, v: string) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalWrap onClose={onClose}>
      <div style={{ padding:"28px 30px", width:"min(560px,92vw)" }}>
        <ModalHeader title={title} onClose={onClose} />
        <form onSubmit={onSubmit}>
          <div style={{ display:"grid", gap:16 }}>
            <FInput label="Title" value={form.title} onChange={v=>upd("title",v)} required />
            <FInput label="Author" value={form.author} onChange={v=>upd("author",v)} required />
            <FInput label="ISBN" value={form.isbn} onChange={v=>upd("isbn",v)} required />
            <FInput label="Category" value={form.category} onChange={v=>upd("category",v)} required />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <FInput label="Total copies" type="number" min="0" value={form.totalCopies} onChange={v=>upd("totalCopies",v)} required />
              <FInput label="Available copies" type="number" min="0" value={form.availableCopies} onChange={v=>upd("availableCopies",v)} required />
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:24 }}>
            <button type="button" onClick={onClose} style={secBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={primaryBtnStyle}>{loading?"Saving...":submitText}</button>
          </div>
        </form>
      </div>
    </ModalWrap>
  );
}

// ─── Book Details Modal ───────────────────────────────────────────────────────
function BookDetailsModal({ book, canManageBooks, onClose, onEdit, onDelete, onBorrow }: { book:Book; canManageBooks:boolean; onClose:()=>void; onEdit:()=>void; onDelete:()=>void; onBorrow:()=>void }) {
  const bg = getCoverBg(book.category);
  const available = book.availableCopies > 0;
  return (
    <ModalWrap onClose={onClose}>
      <div style={{ width:"min(620px,92vw)" }}>
        <div style={{ height:180, background:bg, padding:"24px 28px", position:"relative", display:"flex", flexDirection:"column", justifyContent:"space-between", borderRadius:"18px 18px 0 0", overflow:"hidden" }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div style={{ fontSize:9, letterSpacing:2, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase" }}>{book.category}</div>
            <button onClick={onClose} style={{ border:0, background:"rgba(255,255,255,0.2)", color:"white", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><X size={16}/></button>
          </div>
          <div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:28, fontWeight:700, color:"white", lineHeight:1.2, marginBottom:6 }}>{book.title}</div>
            <div style={{ color:"rgba(255,255,255,0.75)", fontSize:14 }}>by {book.author}</div>
          </div>
        </div>
        <div style={{ padding:"24px 28px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
            <IBox label="ISBN" value={book.isbn} />
            <IBox label="Total copies" value={String(book.totalCopies)} />
            <IBox label="Available" value={String(book.availableCopies)} hi={available?"green":"orange"} />
          </div>
          <div style={{ marginBottom:20, padding:14, borderRadius:10, background:available?"#d1fae5":"#fef3c7", display:"flex", alignItems:"center", gap:10 }}>
            <span>{available?"✅":"⏳"}</span>
            <span style={{ fontSize:13, fontWeight:600, color:available?"#059669":"#d97706" }}>
              {available?`${book.availableCopies} copies available to borrow`:"All copies are currently on loan"}
            </span>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, flexWrap:"wrap" }}>
            {available && <button onClick={onBorrow} style={primaryBtnStyle}><BookOpen size={16}/> Borrow book</button>}
            {canManageBooks && <>
              <button onClick={onEdit} style={secBtnStyle}><Edit3 size={15}/> Edit</button>
              <button onClick={onDelete} style={{ ...secBtnStyle, color:"#dc2626", borderColor:"#fecaca" }}><Trash2 size={15}/> Delete</button>
            </>}
          </div>
        </div>
      </div>
    </ModalWrap>
  );
}

// ─── Borrow Modal ─────────────────────────────────────────────────────────────
function BorrowModal({ book, dueDate, setDueDate, loading, onClose, onSubmit }: { book:Book; dueDate:string; setDueDate:(v:string)=>void; loading:boolean; onClose:()=>void; onSubmit:(e:React.FormEvent)=>void }) {
  return (
    <ModalWrap onClose={onClose}>
      <div style={{ padding:"28px 30px", width:"min(420px,92vw)" }}>
        <ModalHeader title="Borrow book" onClose={onClose} />
        <div style={{ padding:"14px 16px", borderRadius:10, background:"#e6f4f1", marginBottom:20, display:"flex", gap:10, alignItems:"center" }}>
          <BookOpen size={18} color="#155e59" style={{ flexShrink:0 }}/>
          <span style={{ fontSize:14, color:"#155e59", fontWeight:500 }}>You are borrowing <strong>{book.title}</strong></span>
        </div>
        <form onSubmit={onSubmit}>
          <FInput label="Return due date" type="date" value={dueDate} min={new Date().toISOString().split("T")[0]} onChange={setDueDate} required />
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:24 }}>
            <button type="button" onClick={onClose} style={secBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={primaryBtnStyle}>{loading?"Processing...":"Confirm borrow"}</button>
          </div>
        </form>
      </div>
    </ModalWrap>
  );
}

// ─── Shared Components ─────────────────────────────────────────────────────────
function ModalWrap({ children, onClose }: { children:React.ReactNode; onClose:()=>void }) {
  return (
    <div onMouseDown={onClose} style={{ position:"fixed", inset:0, background:"rgba(5,20,18,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20, backdropFilter:"blur(4px)" }}>
      <div onMouseDown={e=>e.stopPropagation()} style={{ background:"white", borderRadius:20, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 30px 80px rgba(0,0,0,0.25)" }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title:string; onClose:()=>void }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
      <h2 style={{ margin:0, fontFamily:"Georgia,serif", fontSize:24, color:"#0f2d2a" }}>{title}</h2>
      <button onClick={onClose} style={{ border:0, background:"#f0f4f3", borderRadius:8, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#81918e" }}><X size={17}/></button>
    </div>
  );
}

function FInput({ label, value, onChange, type="text", min, required }: { label:string; value:string; onChange:(v:string)=>void; type?:string; min?:string; required?:boolean }) {
  return (
    <label style={{ display:"block", fontSize:13, fontWeight:700, color:"#375e59" }}>
      {label}
      <input type={type} value={value} min={min} required={required} onChange={e=>onChange(e.target.value)}
        style={{ display:"block", width:"100%", boxSizing:"border-box", marginTop:6, border:"1.5px solid #dce6e3", borderRadius:10, padding:"11px 13px", outline:0, fontSize:14, background:"#fafcfb" }}
        onFocus={e=>{e.target.style.borderColor="#14b8a6";e.target.style.background="white";}}
        onBlur={e=>{e.target.style.borderColor="#dce6e3";e.target.style.background="#fafcfb";}}
      />
    </label>
  );
}

function IBox({ label, value, hi }: { label:string; value:string; hi?:"green"|"orange" }) {
  return (
    <div style={{ background:hi==="green"?"#d1fae5":hi==="orange"?"#fef3c7":"#f7faf9", borderRadius:10, padding:"12px 14px" }}>
      <div style={{ fontSize:10, color:"#81918e", textTransform:"uppercase", letterSpacing:1, fontWeight:700 }}>{label}</div>
      <div style={{ marginTop:5, fontWeight:800, fontSize:16, color:hi==="green"?"#059669":hi==="orange"?"#d97706":"#0f2d2a" }}>{value}</div>
    </div>
  );
}

function AlertBar({ type, message, onClose }: { type:"error"|"success"; message:string; onClose:()=>void }) {
  return (
    <div style={{ marginBottom:20, padding:"14px 18px", borderRadius:12, background:type==="error"?"#fef2f2":"#ecfdf5", color:type==="error"?"#dc2626":"#059669", border:`1px solid ${type==="error"?"#fecaca":"#a7f3d0"}`, display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:14, fontWeight:500 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {type==="error"?<AlertCircle size={17}/>:<CheckCircle2 size={17}/>}
        <span>{message}</span>
      </div>
      <button onClick={onClose} style={{ border:0, background:"transparent", cursor:"pointer", color:"inherit", display:"flex" }}><X size={15}/></button>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const iconBtnStyle: React.CSSProperties = { border:0, background:"#f0f4f3", color:"#55736d", borderRadius:7, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" };
const primaryBtnStyle: React.CSSProperties = { border:0, borderRadius:10, background:"linear-gradient(135deg,#155e59,#0d9488)", color:"white", padding:"11px 18px", cursor:"pointer", fontWeight:700, fontSize:14, display:"inline-flex", alignItems:"center", gap:8, boxShadow:"0 4px 14px rgba(21,94,89,0.35)" };
const secBtnStyle: React.CSSProperties = { border:"1.5px solid #dce6e3", borderRadius:10, background:"white", color:"#426058", padding:"10px 16px", cursor:"pointer", fontWeight:700, fontSize:14, display:"inline-flex", alignItems:"center", gap:8 };
const menuBtnStyle: React.CSSProperties = { width:"100%", border:0, background:"transparent", borderRadius:8, padding:"10px 12px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", color:"#375e59", fontSize:13, textAlign:"left" };
