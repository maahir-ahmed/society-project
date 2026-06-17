import { prisma } from "./db";
import { sendEmail, notificationEmail } from "./email";
import type { NotificationType } from "@prisma/client";

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
  sendEmailNotification = true,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  sendEmailNotification?: boolean;
}) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });

  if (sendEmailNotification) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: title,
        html: notificationEmail(title, body, link),
        text: body,
      }).catch(() => {}); // don't fail the request if email fails
    }
  }

  return notification;
}

export async function notifyExecs(
  societyId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  const execs = await prisma.societyMembership.findMany({
    where: { societyId, role: "EXECUTIVE", isActive: true },
    select: { userId: true },
  });

  await Promise.all(
    execs.map((e) =>
      createNotification({ userId: e.userId, type, title, body, link })
    )
  );
}
