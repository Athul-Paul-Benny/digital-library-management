const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: any;
};

async function request<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const text = await response.text();

  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        data.errors?.[0]?.msg ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  lostCopies?: number;
  damagedCopies?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BorrowRecord {
  _id: string;
  book?: Book;
  bookId?: Book | string;
  user?: User;
  borrowedAt?: string;
  dueDate?: string;
  returnedAt?: string;
  status?: string;
}

export async function register(
  name: string,
  email: string,
  password: string
) {
  return request<{
    message: string;
    token: string;
    user: User;
  }>("/users/register", {
    method: "POST",
    body: {
      name,
      email,
      password,
    },
  });
}

export async function login(email: string, password: string) {
  return request<{
    message: string;
    token: string;
    user: User;
  }>("/users/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
}

export async function getProfile() {
  return request<{
    success?: boolean;
    user: User;
    data?: User;
  }>("/users/profile");
}

export async function updateProfile(data: {
  name?: string;
  email?: string;
  password?: string;
}) {
  return request<any>("/users/profile", {
    method: "PUT",
    body: data,
  });
}

export async function getBooks() {
  return request<{
    success: boolean;
    count: number;
    data: Book[];
  }>("/books");
}

export async function getBook(id: string) {
  return request<{
    success: boolean;
    data: Book;
  }>(`/books/${id}`);
}

export async function addBook(book: {
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}) {
  return request<{
    success: boolean;
    message: string;
    data: Book;
  }>("/books", {
    method: "POST",
    body: book,
  });
}

export async function updateBook(
  id: string,
  book: Partial<{
    title: string;
    author: string;
    isbn: string;
    category: string;
    totalCopies: number;
    availableCopies: number;
  }>
) {
  return request<{
    success: boolean;
    message: string;
    data: Book;
  }>(`/books/${id}`, {
    method: "PUT",
    body: book,
  });
}

export async function deleteBook(id: string) {
  return request<{
    success: boolean;
    message: string;
  }>(`/books/${id}`, {
    method: "DELETE",
  });
}

export async function searchBooks(params: {
  title?: string;
  author?: string;
  category?: string;
  available?: boolean;
}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.append(key, String(value));
    }
  });

  return request<{
    success: boolean;
    count: number;
    data: Book[];
  }>(`/books/search?${query.toString()}`);
}

export async function borrowBook(bookId: string, dueDate: string) {
  return request<any>("/borrow", {
    method: "POST",
    body: {
      bookId,
      dueDate,
    },
  });
}

export async function returnBook(id: string) {
  return request<any>(`/borrow/${id}/return`, {
    method: "PUT",
  });
}

export async function getMyBorrows() {
  return request<{
    success?: boolean;
    count?: number;
    data: BorrowRecord[];
  }>("/borrow/my");
}

export async function getAllBorrows() {
  return request<{
    success?: boolean;
    count?: number;
    data: BorrowRecord[];
  }>("/borrow");
}