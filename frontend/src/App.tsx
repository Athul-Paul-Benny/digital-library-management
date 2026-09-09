import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronDown,
  Clock3,
  Edit3,
  Grid2X2,
  Library,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Trash2,
  User,
  Users,
  X,
  RotateCcw,
  BookMarked,
} from "lucide-react";

import { useAuth } from "./lib/auth";

import {
  addBook,
  Book,
  borrowBook,
  deleteBook,
  getBooks,
  getMyBorrows,
  returnBook,
  updateBook,
  BorrowRecord,
} from "./lib/api";

import AuthPage from "./components/AuthPage";

type Page =
  | "overview"
  | "library"
  | "members"
  | "collections";

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

function getInitials(title: string) {
  return title
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date?: string) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function App() {
  const { user, session, loading: authLoading, signOut } =
    useAuth();

  const [page, setPage] = useState<Page>("collections");

  const [books, setBooks] = useState<Book[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>(
    []
  );

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All books");

  const [modal, setModal] =
    useState<ModalType>(null);

  const [selectedBook, setSelectedBook] =
    useState<Book | null>(null);

  const [form, setForm] =
    useState<BookForm>(emptyForm);

  const [dueDate, setDueDate] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [mobileSidebar, setMobileSidebar] =
    useState(false);

  const canManageBooks =
    user?.role === "admin" ||
    user?.role === "librarian";

  async function loadBooks() {
    try {
      setLoading(true);

      const response = await getBooks();

      setBooks(response.data || []);
    } catch (err: any) {
      setError(
        err?.message || "Unable to load books."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadBorrows() {
    try {
      const response = await getMyBorrows();

      setBorrows(response.data || []);
    } catch {
      setBorrows([]);
    }
  }

  useEffect(() => {
    if (!session) return;

    loadBooks();
    loadBorrows();
  }, [session]);

  useEffect(() => {
    if (!error && !success) return;

    const timer = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [error, success]);

  const categories = useMemo(() => {
    const values = books
      .map((book) => book.category)
      .filter(Boolean);

    return [
      "All books",
      ...Array.from(new Set(values)),
    ];
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.category.toLowerCase().includes(query) ||
        book.isbn.toLowerCase().includes(query);

      const matchesCategory =
        category === "All books" ||
        book.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [books, search, category]);

  const totalBooks = books.length;

  const totalCopies = books.reduce(
    (sum, book) => sum + (book.totalCopies || 0),
    0
  );

  const availableCopies = books.reduce(
    (sum, book) =>
      sum + (book.availableCopies || 0),
    0
  );

  const onLoan = Math.max(
    0,
    totalCopies - availableCopies
  );

  const newThisMonth = books.filter((book) => {
    if (!book.createdAt) return false;

    const date = new Date(book.createdAt);
    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#155e59",
          fontSize: 18,
        }}
      >
        Loading Folio...
      </div>
    );
  }

  if (!user || !session) {
    return <AuthPage />;
  }

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setMobileSidebar(false);
    setProfileOpen(false);
  }

  function openAddModal() {
    setForm(emptyForm);
    setSelectedBook(null);
    setError("");
    setModal("add");
  }

  function openEditModal(book: Book) {
    setSelectedBook(book);

    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: String(book.totalCopies),
      availableCopies: String(
        book.availableCopies
      ),
    });

    setError("");
    setModal("edit");
  }

  function openDetails(book: Book) {
    setSelectedBook(book);
    setModal("details");
  }

  async function handleAddBook(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!canManageBooks) {
      setError(
        "Only admin or librarian accounts can add books."
      );
      return;
    }

    try {
      setLoading(true);

      await addBook({
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim(),
        category: form.category.trim(),
        totalCopies: Number(form.totalCopies),
        availableCopies: Number(
          form.availableCopies
        ),
      });

      setModal(null);
      setSuccess("Book added successfully.");
      await loadBooks();
    } catch (err: any) {
      setError(
        err?.message || "Unable to add the book."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEditBook(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!selectedBook) return;

    if (!canManageBooks) {
      setError(
        "Only admin or librarian accounts can edit books."
      );
      return;
    }

    try {
      setLoading(true);

      await updateBook(selectedBook._id, {
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim(),
        category: form.category.trim(),
        totalCopies: Number(form.totalCopies),
        availableCopies: Number(
          form.availableCopies
        ),
      });

      setModal(null);
      setSuccess("Book updated successfully.");
      await loadBooks();
    } catch (err: any) {
      setError(
        err?.message || "Unable to update the book."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBook(book: Book) {
    if (!canManageBooks) {
      setError(
        "Only admin or librarian accounts can delete books."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete "${book.title}"?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      await deleteBook(book._id);

      setSuccess("Book deleted successfully.");

      if (selectedBook?._id === book._id) {
        setSelectedBook(null);
        setModal(null);
      }

      await loadBooks();
    } catch (err: any) {
      setError(
        err?.message || "Unable to delete the book."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleBorrow(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!selectedBook) return;

    if (!dueDate) {
      setError("Please select a due date.");
      return;
    }

    try {
      setLoading(true);

      await borrowBook(
        selectedBook._id,
        dueDate
      );

      setModal(null);

      setSuccess(
        `"${selectedBook.title}" borrowed successfully.`
      );

      await loadBooks();
      await loadBorrows();
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to borrow this book."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(
    borrow: BorrowRecord
  ) {
    try {
      setLoading(true);

      await returnBook(borrow._id);

      setSuccess("Book returned successfully.");

      await loadBooks();
      await loadBorrows();
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to return the book."
      );
    } finally {
      setLoading(false);
    }
  }

  function getBorrowBook(
    borrow: BorrowRecord
  ): Book | null {
    if (
      borrow.book &&
      typeof borrow.book !== "string"
    ) {
      return borrow.book;
    }

    if (
      borrow.bookId &&
      typeof borrow.bookId !== "string"
    ) {
      return borrow.bookId;
    }

    if (typeof borrow.bookId === "string") {
      return (
        books.find(
          (book) => book._id === borrow.bookId
        ) || null
      );
    }

    return null;
  }

  const pageTitle =
    page === "overview"
      ? "Overview"
      : page === "library"
      ? "My Library"
      : page === "members"
      ? "Members"
      : "Collections";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f7f9f8",
        color: "#173f3b",
      }}
    >
      {mobileSidebar && (
        <div
          onClick={() => setMobileSidebar(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 20,
          }}
        />
      )}

      <aside
        style={{
          width: 290,
          background: "#eef4f2",
          borderRight: "1px solid #dce7e4",
          minHeight: "100vh",
          padding: "28px 16px",
          position: "fixed",
          left: mobileSidebar ? 0 : undefined,
          transform:
            mobileSidebar || window.innerWidth > 800
              ? "translateX(0)"
              : "translateX(-100%)",
          zIndex: 30,
          transition: "transform 0.25s",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px",
            marginBottom: 55,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "#155e59",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={21} />
          </div>

          <strong
            style={{
              fontSize: 25,
              letterSpacing: "-1px",
            }}
          >
            folio
          </strong>
        </div>

        <div
          style={{
            padding: "0 16px",
            color: "#78908c",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            marginBottom: 12,
          }}
        >
          WORKSPACE
        </div>

        <SidebarButton
          icon={<Grid2X2 size={20} />}
          label="Overview"
          active={page === "overview"}
          onClick={() => navigate("overview")}
        />

        <SidebarButton
          icon={<Library size={20} />}
          label="My Library"
          active={page === "library"}
          onClick={() => navigate("library")}
        />

        <SidebarButton
          icon={<Users size={20} />}
          label="Members"
          active={page === "members"}
          onClick={() => navigate("members")}
        />

        <SidebarButton
          icon={<BookMarked size={20} />}
          label="Collections"
          active={page === "collections"}
          onClick={() => navigate("collections")}
        />

        <div
          style={{
            padding: "40px 16px 12px",
            color: "#78908c",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
          }}
        >
          YOUR COLLECTIONS
        </div>

        <CollectionLink
          dot="#75a98e"
          label="Recently added"
          onClick={() => {
            navigate("collections");
            setSearch("");
          }}
        />

        <CollectionLink
          dot="#dfa761"
          label="Reading list"
          onClick={() => navigate("library")}
        />

        <CollectionLink
          dot="#c98b91"
          label="Staff picks"
          onClick={() => navigate("collections")}
        />

        <div
          style={{
            position: "absolute",
            bottom: 25,
            left: 16,
            right: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 15px",
            borderRadius: 12,
            background: "#e1ece9",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 35,
                height: 35,
                borderRadius: "50%",
                background: "#b96d4c",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {getInitials(user.name)}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#79908c",
                }}
              >
                {user.role}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main
        style={{
          marginLeft:
            typeof window !== "undefined" &&
            window.innerWidth > 800
              ? 290
              : 0,
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            height: 86,
            borderBottom: "1px solid #e1e8e6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 34px",
            background: "#fafcfb",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <button
              onClick={() => setMobileSidebar(true)}
              style={{
                display: "none",
                border: 0,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <Menu />
            </button>

            <span
              style={{
                color: "#9aa9a6",
                fontSize: 14,
              }}
            >
              Workspace
            </span>

            <span style={{ color: "#c5cfcd" }}>
              /
            </span>

            <strong style={{ fontSize: 14 }}>
              {pageTitle}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "relative",
                color: "#607873",
              }}
            >
              <Clock3 size={20} />
              <span
                style={{
                  position: "absolute",
                  width: 6,
                  height: 6,
                  background: "#c8745a",
                  borderRadius: "50%",
                  right: -2,
                  top: -1,
                }}
              />
            </div>

            <button
              onClick={() =>
                setProfileOpen(!profileOpen)
              }
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#b96d4c",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {getInitials(user.name)}
              </div>
            </button>

            {profileOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 53,
                  width: 245,
                  background: "white",
                  border: "1px solid #dfe8e5",
                  borderRadius: 14,
                  boxShadow:
                    "0 15px 40px rgba(20,50,45,0.14)",
                  padding: 10,
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    padding: "12px 12px 15px",
                    borderBottom:
                      "1px solid #edf1f0",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {user.name}
                  </div>

                  <div
                    style={{
                      color: "#81918e",
                      fontSize: 12,
                      marginTop: 4,
                      wordBreak: "break-all",
                    }}
                  >
                    {user.email}
                  </div>

                  <div
                    style={{
                      display: "inline-block",
                      marginTop: 9,
                      padding: "4px 8px",
                      borderRadius: 6,
                      background: "#e7f1ef",
                      color: "#155e59",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {user.role}
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate("library")
                  }
                  style={menuButtonStyle}
                >
                  <User size={17} />
                  My account
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    signOut();
                  }}
                  style={{
                    ...menuButtonStyle,
                    color: "#b45353",
                  }}
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <div
          style={{
            padding: "55px 5%",
            maxWidth: 1450,
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError("")}
            />
          )}

          {success && (
            <Alert
              type="success"
              message={success}
              onClose={() => setSuccess("")}
            />
          )}

          {page === "overview" && (
            <OverviewPage
              userName={user.name}
              totalBooks={totalBooks}
              totalCopies={totalCopies}
              availableCopies={availableCopies}
              onLoan={onLoan}
              newThisMonth={newThisMonth}
              onCollections={() =>
                navigate("collections")
              }
              onAddBook={openAddModal}
              canManageBooks={canManageBooks}
            />
          )}

          {page === "library" && (
            <MyLibraryPage
              borrows={borrows}
              getBorrowBook={getBorrowBook}
              onReturn={handleReturn}
              onCollections={() =>
                navigate("collections")
              }
            />
          )}

          {page === "members" && (
            <MembersPage
              user={user}
              totalBooks={totalBooks}
            />
          )}

          {page === "collections" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: 20,
                  flexWrap: "wrap",
                  marginBottom: 35,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#c8794e",
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 18,
                    }}
                  >
                    ✦{" "}
                    {new Date().toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>

                  <h1
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize:
                        "clamp(35px, 4vw, 52px)",
                      lineHeight: 1.1,
                      margin: 0,
                      letterSpacing: "-1.5px",
                    }}
                  >
                    Good morning,{" "}
                    {user.name.split(" ")[0]}.
                  </h1>

                  <p
                    style={{
                      color: "#81918e",
                      marginTop: 12,
                    }}
                  >
                    Here's what's happening in
                    your library today.
                  </p>
                </div>

                {canManageBooks && (
                  <button
                    onClick={openAddModal}
                    style={{
                      border: 0,
                      background: "#155e59",
                      color: "white",
                      borderRadius: 10,
                      padding: "12px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    <Plus size={18} />
                    Add book
                  </button>
                )}
              </div>

              <Stats
                totalBooks={totalBooks}
                totalCopies={totalCopies}
                onLoan={onLoan}
                newThisMonth={newThisMonth}
              />

              <div
                style={{
                  marginTop: 65,
                  marginBottom: 25,
                }}
              >
                <h2
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 27,
                    margin: 0,
                  }}
                >
                  Browse your collection
                </h2>

                <p
                  style={{
                    color: "#81918e",
                    marginTop: 8,
                  }}
                >
                  Explore, organize, and keep your
                  library in order.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 25,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    flex: "1 1 350px",
                    display: "flex",
                    alignItems: "center",
                    border:
                      "1px solid #dce6e3",
                    borderRadius: 10,
                    background: "white",
                    padding: "0 14px",
                  }}
                >
                  <Search
                    size={20}
                    color="#9aaba7"
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search by title, author, category or ISBN"
                    style={{
                      flex: 1,
                      border: 0,
                      outline: 0,
                      padding: "14px 10px",
                      fontSize: 14,
                    }}
                  />
                </div>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  style={{
                    border:
                      "1px solid #dce6e3",
                    borderRadius: 10,
                    background: "white",
                    padding: "0 16px",
                    minWidth: 150,
                    color: "#49625e",
                  }}
                >
                  {categories.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {loading && books.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 80,
                    color: "#81918e",
                  }}
                >
                  Loading books...
                </div>
              ) : filteredBooks.length === 0 ? (
                <EmptyBooks
                  canManageBooks={canManageBooks}
                  onAddBook={openAddModal}
                />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 22,
                  }}
                >
                  {filteredBooks.map((book) => (
                    <BookCard
                      key={book._id}
                      book={book}
                      canManageBooks={
                        canManageBooks
                      }
                      onClick={() =>
                        openDetails(book)
                      }
                      onEdit={() =>
                        openEditModal(book)
                      }
                      onDelete={() =>
                        handleDeleteBook(book)
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {modal === "add" && (
        <BookFormModal
          title="Add a new book"
          form={form}
          setForm={setForm}
          loading={loading}
          onClose={() => setModal(null)}
          onSubmit={handleAddBook}
          submitText="Add book"
        />
      )}

      {modal === "edit" && selectedBook && (
        <BookFormModal
          title="Edit book"
          form={form}
          setForm={setForm}
          loading={loading}
          onClose={() => setModal(null)}
          onSubmit={handleEditBook}
          submitText="Save changes"
        />
      )}

      {modal === "details" && selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          canManageBooks={canManageBooks}
          onClose={() => setModal(null)}
          onEdit={() =>
            openEditModal(selectedBook)
          }
          onDelete={() =>
            handleDeleteBook(selectedBook)
          }
          onBorrow={() => {
            setDueDate("");
            setModal("borrow");
          }}
        />
      )}

      {modal === "borrow" && selectedBook && (
        <BorrowModal
          book={selectedBook}
          dueDate={dueDate}
          setDueDate={setDueDate}
          loading={loading}
          onClose={() => setModal("details")}
          onSubmit={handleBorrow}
        />
      )}
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: 0,
        borderRadius: 11,
        background: active
          ? "#d8e9e5"
          : "transparent",
        color: active ? "#155e59" : "#637b77",
        display: "flex",
        alignItems: "center",
        gap: 15,
        padding: "14px 16px",
        marginBottom: 3,
        cursor: "pointer",
        textAlign: "left",
        fontSize: 15,
        fontWeight: active ? 700 : 500,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function CollectionLink({
  dot,
  label,
  onClick,
}: {
  dot: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: 0,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 18px",
        color: "#667e7a",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: dot,
        }}
      />
      {label}
    </button>
  );
}

function Stats({
  totalBooks,
  totalCopies,
  onLoan,
  newThisMonth,
}: {
  totalBooks: number;
  totalCopies: number;
  onLoan: number;
  newThisMonth: number;
}) {
  const cards = [
    {
      label: "Total books",
      value: totalBooks,
      bottom: `${totalCopies} total copies`,
      icon: <BookOpen size={21} />,
    },
    {
      label: "Currently on loan",
      value: onLoan,
      bottom: "Based on available copies",
      icon: <Clock3 size={21} />,
    },
    {
      label: "Available copies",
      value: Math.max(
        0,
        totalCopies - onLoan
      ),
      bottom: "Ready to borrow",
      icon: <Library size={21} />,
    },
    {
      label: "New this month",
      value: newThisMonth,
      bottom: "From MongoDB records",
      icon: <Calendar size={21} />,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 17,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: "white",
            border:
              "1px solid #e0e8e5",
            borderRadius: 14,
            padding: 20,
            minHeight: 105,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: "#e5f0ed",
                color: "#155e59",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {card.icon}
            </div>

            <div>
              <div
                style={{
                  color: "#81918e",
                  fontSize: 13,
                }}
              >
                {card.label}
              </div>

              <div
                style={{
                  fontSize: 27,
                  fontWeight: 700,
                  marginTop: 3,
                }}
              >
                {card.value}
              </div>
            </div>
          </div>

          <div
            style={{
              color: "#81918e",
              fontSize: 11,
              marginTop: 13,
              marginLeft: 54,
            }}
          >
            {card.bottom}
          </div>
        </div>
      ))}
    </div>
  );
}

function BookCard({
  book,
  canManageBooks,
  onClick,
  onEdit,
  onDelete,
}: {
  book: Book;
  canManageBooks: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const available = book.availableCopies > 0;

  return (
    <div
      style={{
        background: "white",
        border:
          "1px solid #dfe8e5",
        borderRadius: 15,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s",
      }}
      onClick={onClick}
    >
      <div
        style={{
          height: 190,
          background: "#e7eff1",
          padding: 20,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 1.5,
            fontWeight: 700,
            color: "#65828a",
          }}
        >
          FOLIO EDITION
        </div>

        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 26,
            fontWeight: 700,
            maxWidth: "85%",
            lineHeight: 1.15,
            color: "#164c54",
          }}
        >
          {book.title}
        </div>

        <div
          style={{
            fontSize: 11,
            color: "#607a80",
          }}
        >
          {book.author}
        </div>

        <div
          style={{
            position: "absolute",
            right: -35,
            bottom: -65,
            width: 170,
            height: 170,
            border:
              "1px solid rgba(60,110,115,0.2)",
            borderRadius: "50%",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: 25,
            bottom: 45,
            color: "rgba(70,110,115,0.2)",
            fontFamily: "Georgia, serif",
            fontSize: 45,
          }}
        >
          {getInitials(book.title)}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {book.title}
            </div>

            <div
              style={{
                color: "#7b908d",
                fontSize: 13,
                marginTop: 5,
              }}
            >
              {book.author}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 4,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {canManageBooks && (
              <>
                <button
                  onClick={onEdit}
                  title="Edit"
                  style={iconButtonStyle}
                >
                  <Edit3 size={16} />
                </button>

                <button
                  onClick={onDelete}
                  title="Delete"
                  style={{
                    ...iconButtonStyle,
                    color: "#b65c5c",
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 22,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: available
                ? "#5e8175"
                : "#bd8152",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: available
                  ? "#75a98e"
                  : "#dfa761",
                marginRight: 7,
              }}
            />

            {available
              ? `${book.availableCopies} available`
              : "On loan"}
          </div>

          <div
            style={{
              fontSize: 11,
              color: "#8b9b98",
            }}
          >
            {book.category}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewPage({
  userName,
  totalBooks,
  totalCopies,
  availableCopies,
  onLoan,
  newThisMonth,
  onCollections,
  onAddBook,
  canManageBooks,
}: {
  userName: string;
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  onLoan: number;
  newThisMonth: number;
  onCollections: () => void;
  onAddBook: () => void;
  canManageBooks: boolean;
}) {
  return (
    <>
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            color: "#c8794e",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 18,
          }}
        >
          ✦ Library overview
        </div>

        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize:
              "clamp(36px, 4vw, 52px)",
            margin: 0,
          }}
        >
          Welcome back,{" "}
          {userName.split(" ")[0]}.
        </h1>

        <p
          style={{
            color: "#81918e",
            marginTop: 12,
          }}
        >
          Here's the current state of your
          digital library.
        </p>
      </div>

      <Stats
        totalBooks={totalBooks}
        totalCopies={totalCopies}
        onLoan={onLoan}
        newThisMonth={newThisMonth}
      />

      <div
        style={{
          marginTop: 35,
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 18,
        }}
      >
        <ActionCard
          icon={<Library />}
          title="Browse collection"
          text="View and search all books."
          onClick={onCollections}
        />

        {canManageBooks && (
          <ActionCard
            icon={<Plus />}
            title="Add a book"
            text="Add a new book to MongoDB."
            onClick={onAddBook}
          />
        )}
      </div>
    </>
  );
}

function ActionCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "white",
        border:
          "1px solid #e0e8e5",
        borderRadius: 15,
        padding: 25,
        textAlign: "left",
        cursor: "pointer",
        color: "#173f3b",
      }}
    >
      <div
        style={{
          width: 43,
          height: 43,
          borderRadius: 10,
          background: "#e4efec",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#155e59",
          marginBottom: 18,
        }}
      >
        {icon}
      </div>

      <strong style={{ fontSize: 17 }}>
        {title}
      </strong>

      <div
        style={{
          color: "#81918e",
          marginTop: 7,
          fontSize: 13,
        }}
      >
        {text}
      </div>
    </button>
  );
}

function MyLibraryPage({
  borrows,
  getBorrowBook,
  onReturn,
  onCollections,
}: {
  borrows: BorrowRecord[];
  getBorrowBook: (
    borrow: BorrowRecord
  ) => Book | null;
  onReturn: (borrow: BorrowRecord) => void;
  onCollections: () => void;
}) {
  return (
    <>
      <div style={{ marginBottom: 35 }}>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 45,
            margin: 0,
          }}
        >
          My Library
        </h1>

        <p
          style={{
            color: "#81918e",
            marginTop: 10,
          }}
        >
          Books you have borrowed from the library.
        </p>
      </div>

      {borrows.length === 0 ? (
        <div
          style={{
            background: "white",
            border:
              "1px solid #e0e8e5",
            borderRadius: 15,
            padding: 60,
            textAlign: "center",
          }}
        >
          <BookMarked
            size={40}
            color="#81918e"
          />

          <h3>No borrowed books</h3>

          <p
            style={{
              color: "#81918e",
            }}
          >
            You haven't borrowed any books yet.
          </p>

          <button
            onClick={onCollections}
            style={{
              marginTop: 10,
              border: 0,
              borderRadius: 9,
              padding: "11px 17px",
              background: "#155e59",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Browse books
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 15,
          }}
        >
          {borrows.map((borrow) => {
            const book = getBorrowBook(borrow);

            return (
              <div
                key={borrow._id}
                style={{
                  background: "white",
                  border:
                    "1px solid #e0e8e5",
                  borderRadius: 14,
                  padding: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 20,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>
                    {book?.title ||
                      "Borrowed book"}
                  </strong>

                  <div
                    style={{
                      color: "#81918e",
                      fontSize: 13,
                      marginTop: 6,
                    }}
                  >
                    {book?.author || ""}
                  </div>

                  <div
                    style={{
                      color: "#81918e",
                      fontSize: 12,
                      marginTop: 7,
                    }}
                  >
                    Due:{" "}
                    {formatDate(
                      borrow.dueDate
                    )}
                  </div>
                </div>

                {!borrow.returnedAt &&
                  borrow.status !== "returned" && (
                    <button
                      onClick={() =>
                        onReturn(borrow)
                      }
                      style={{
                        border: 0,
                        borderRadius: 9,
                        background: "#155e59",
                        color: "white",
                        padding:
                          "10px 15px",
                        cursor: "pointer",
                        display: "flex",
                        gap: 7,
                        alignItems:
                          "center",
                        fontWeight: 700,
                      }}
                    >
                      <RotateCcw size={16} />
                      Return
                    </button>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function MembersPage({
  user,
  totalBooks,
}: {
  user: {
    name: string;
    email: string;
    role: string;
  };
  totalBooks: number;
}) {
  return (
    <>
      <div style={{ marginBottom: 35 }}>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 45,
            margin: 0,
          }}
        >
          Members
        </h1>

        <p
          style={{
            color: "#81918e",
            marginTop: 10,
          }}
        >
          Library account and member information.
        </p>
      </div>

      <div
        style={{
          background: "white",
          border:
            "1px solid #e0e8e5",
          borderRadius: 15,
          padding: 30,
          maxWidth: 700,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 25,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#b96d4c",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            {getInitials(user.name)}
          </div>

          <div>
            <h3 style={{ margin: 0 }}>
              {user.name}
            </h3>

            <div
              style={{
                color: "#81918e",
                marginTop: 5,
              }}
            >
              {user.email}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, 1fr)",
            gap: 15,
          }}
        >
          <InfoBox
            label="Account role"
            value={user.role}
          />

          <InfoBox
            label="Books in system"
            value={String(totalBooks)}
          />
        </div>

        <div
          style={{
            marginTop: 25,
            padding: 15,
            borderRadius: 10,
            background: "#f1f6f4",
            color: "#6d8580",
            fontSize: 13,
          }}
        >
          The current backend exposes profile and
          borrowing APIs, but it does not expose a
          full member-list endpoint. This page
          therefore shows the signed-in member
          account rather than inventing member data.
        </div>
      </div>
    </>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f7faf9",
        borderRadius: 10,
        padding: 15,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#81918e",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyBooks({
  canManageBooks,
  onAddBook,
}: {
  canManageBooks: boolean;
  onAddBook: () => void;
}) {
  return (
    <div
      style={{
        background: "white",
        border:
          "1px solid #e0e8e5",
        borderRadius: 15,
        padding: 60,
        textAlign: "center",
      }}
    >
      <BookOpen
        size={45}
        color="#91a39f"
      />

      <h3>No books found</h3>

      <p
        style={{
          color: "#81918e",
        }}
      >
        Try changing your search or category.
      </p>

      {canManageBooks && (
        <button
          onClick={onAddBook}
          style={{
            marginTop: 10,
            border: 0,
            borderRadius: 9,
            padding: "11px 17px",
            background: "#155e59",
            color: "white",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Add a book
        </button>
      )}
    </div>
  );
}

function BookFormModal({
  title,
  form,
  setForm,
  loading,
  onClose,
  onSubmit,
  submitText,
}: {
  title: string;
  form: BookForm;
  setForm: React.Dispatch<
    React.SetStateAction<BookForm>
  >;
  loading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitText: string;
}) {
  function update(
    key: keyof BookForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  return (
    <Modal onClose={onClose}>
      <div
        style={{
          padding: 28,
          width: "min(600px, 92vw)",
        }}
      >
        <ModalHeader
          title={title}
          onClose={onClose}
        />

        <form onSubmit={onSubmit}>
          <div
            style={{
              display: "grid",
              gap: 15,
            }}
          >
            <Input
              label="Title"
              value={form.title}
              onChange={(value) =>
                update("title", value)
              }
              required
            />

            <Input
              label="Author"
              value={form.author}
              onChange={(value) =>
                update("author", value)
              }
              required
            />

            <Input
              label="ISBN"
              value={form.isbn}
              onChange={(value) =>
                update("isbn", value)
              }
              required
            />

            <Input
              label="Category"
              value={form.category}
              onChange={(value) =>
                update("category", value)
              }
              required
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 15,
              }}
            >
              <Input
                label="Total copies"
                type="number"
                min="0"
                value={form.totalCopies}
                onChange={(value) =>
                  update(
                    "totalCopies",
                    value
                  )
                }
                required
              />

              <Input
                label="Available copies"
                type="number"
                min="0"
                value={
                  form.availableCopies
                }
                onChange={(value) =>
                  update(
                    "availableCopies",
                    value
                  )
                }
                required
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 25,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={primaryButtonStyle}
            >
              {loading
                ? "Saving..."
                : submitText}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function BookDetailsModal({
  book,
  canManageBooks,
  onClose,
  onEdit,
  onDelete,
  onBorrow,
}: {
  book: Book;
  canManageBooks: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBorrow: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div
        style={{
          padding: 28,
          width: "min(650px, 92vw)",
        }}
      >
        <ModalHeader
          title="Book details"
          onClose={onClose}
        />

        <div
          style={{
            background: "#e7eff1",
            borderRadius: 13,
            padding: 30,
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              color: "#65828a",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.5,
            }}
          >
            FOLIO EDITION
          </div>

          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 34,
              fontWeight: 700,
              color: "#164c54",
            }}
          >
            {book.title}
          </div>

          <div
            style={{
              color: "#607a80",
            }}
          >
            {book.author}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, 1fr)",
            gap: 12,
            marginTop: 20,
          }}
        >
          <InfoBox
            label="Author"
            value={book.author}
          />

          <InfoBox
            label="Category"
            value={book.category}
          />

          <InfoBox
            label="ISBN"
            value={book.isbn}
          />

          <InfoBox
            label="Total copies"
            value={String(book.totalCopies)}
          />

          <InfoBox
            label="Available"
            value={String(
              book.availableCopies
            )}
          />

          <InfoBox
            label="Added"
            value={formatDate(
              book.createdAt
            )}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 25,
            flexWrap: "wrap",
          }}
        >
          {book.availableCopies > 0 && (
            <button
              onClick={onBorrow}
              style={primaryButtonStyle}
            >
              Borrow book
            </button>
          )}

          {canManageBooks && (
            <>
              <button
                onClick={onEdit}
                style={secondaryButtonStyle}
              >
                <Edit3 size={16} />
                Edit
              </button>

              <button
                onClick={onDelete}
                style={{
                  ...secondaryButtonStyle,
                  color: "#b45353",
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function BorrowModal({
  book,
  dueDate,
  setDueDate,
  loading,
  onClose,
  onSubmit,
}: {
  book: Book;
  dueDate: string;
  setDueDate: (value: string) => void;
  loading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Modal onClose={onClose}>
      <div
        style={{
          padding: 28,
          width: "min(450px, 92vw)",
        }}
      >
        <ModalHeader
          title="Borrow book"
          onClose={onClose}
        />

        <p
          style={{
            color: "#6f8581",
            lineHeight: 1.6,
          }}
        >
          You are borrowing{" "}
          <strong>{book.title}</strong>.
        </p>

        <form onSubmit={onSubmit}>
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            min={
              new Date()
                .toISOString()
                .split("T")[0]
            }
            onChange={setDueDate}
            required
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 25,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={primaryButtonStyle}
            >
              {loading
                ? "Borrowing..."
                : "Confirm borrow"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,35,32,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onMouseDown={(e) =>
          e.stopPropagation()
        }
        style={{
          background: "white",
          borderRadius: 18,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow:
            "0 25px 70px rgba(0,0,0,0.18)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 25,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "Georgia, serif",
          fontSize: 27,
        }}
      >
        {title}
      </h2>

      <button
        onClick={onClose}
        style={{
          border: 0,
          background: "#f1f5f4",
          borderRadius: 8,
          width: 35,
          height: 35,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  min,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  required?: boolean;
}) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 13,
        fontWeight: 700,
        color: "#49625e",
      }}
    >
      {label}

      <input
        type={type}
        value={value}
        min={min}
        required={required}
        onChange={(e) =>
          onChange(e.target.value)
        }
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          marginTop: 7,
          border:
            "1px solid #dce6e3",
          borderRadius: 9,
          padding: "12px 13px",
          outline: 0,
          fontSize: 14,
        }}
      />
    </label>
  );
}

function Alert({
  type,
  message,
  onClose,
}: {
  type: "error" | "success";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        marginBottom: 20,
        padding: "12px 15px",
        borderRadius: 10,
        background:
          type === "error"
            ? "#fff0f0"
            : "#e9f5ef",
        color:
          type === "error"
            ? "#b45353"
            : "#31765c",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 14,
      }}
    >
      <span>{message}</span>

      <button
        onClick={onClose}
        style={{
          border: 0,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  border: 0,
  background: "#f0f5f3",
  color: "#55736d",
  borderRadius: 7,
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 9,
  background: "#155e59",
  color: "white",
  padding: "11px 17px",
  cursor: "pointer",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #dce6e3",
  borderRadius: 9,
  background: "white",
  color: "#42615c",
  padding: "10px 15px",
  cursor: "pointer",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

const menuButtonStyle: React.CSSProperties = {
  width: "100%",
  border: 0,
  background: "transparent",
  borderRadius: 8,
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  color: "#526b67",
  fontSize: 13,
  textAlign: "left",
};

export default App;