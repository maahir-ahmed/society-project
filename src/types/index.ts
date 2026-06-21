import type {
  Society,
  User,
  SocietyMembership,
  Comment,
  Role,
} from "@prisma/client";

export type { Role };

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
