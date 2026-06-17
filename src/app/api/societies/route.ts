import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { generateSlug } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const { session, error: authErr } = await requireAuth();
  if (authErr) return authErr;

  try {
    const body = schema.parse(await req.json());
    let slug = generateSlug(body.name);

    // Ensure uniqueness
    const existing = await prisma.society.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const society = await prisma.society.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        contactEmail: body.contactEmail,
        memberships: {
          create: {
            userId: session!.user.id,
            role: "EXECUTIVE",
            title: "Founder",
          },
        },
      },
    });

    return NextResponse.json(society, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
