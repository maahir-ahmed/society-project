import type {
  Society,
  User,
  SocietyMembership,
  ContentRequest,
  RoomBooking,
  TreasuryRequest,
  TreasuryApproval,
  Comment,
  Notification,
  Role,
} from "@prisma/client";

export type { Role };

export type SocietyWithMemberships = Society & {
  memberships: (SocietyMembership & { user: User })[];
};

export type UserWithMemberships = User & {
  memberships: (SocietyMembership & { society: Society })[];
};

export type ContentRequestWithRelations = ContentRequest & {
  submittedBy: Pick<User, "id" | "name" | "avatarUrl">;
  assignedTo: Pick<User, "id" | "name" | "avatarUrl"> | null;
  thread: { id: string; _count: { comments: number } } | null;
};

export type RoomBookingWithRelations = RoomBooking & {
  submittedBy: Pick<User, "id" | "name" | "avatarUrl">;
  assignedTo: Pick<User, "id" | "name" | "avatarUrl"> | null;
  thread: { id: string; _count: { comments: number } } | null;
};

export type TreasuryRequestWithRelations = TreasuryRequest & {
  submittedBy: Pick<User, "id" | "name" | "avatarUrl">;
  approvals: (TreasuryApproval & {
    approvedBy: Pick<User, "id" | "name" | "avatarUrl">;
  })[];
  thread: { id: string; _count: { comments: number } } | null;
};

export type CommentWithAuthor = Comment & {
  author: Pick<User, "id" | "name" | "avatarUrl">;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  memberships: (SocietyMembership & { society: Society })[];
};

// API response types
export type ApiResponse<T> =
  | { data: T; error?: never }
  | { error: string; data?: never };

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
