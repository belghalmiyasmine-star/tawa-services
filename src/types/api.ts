// Type de reponse API standard
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Type de reponse paginee
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Type d'erreur API
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, string[]>;
}

// Parametre de pagination standard
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Parametre de tri standard
export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Type pour les Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };
