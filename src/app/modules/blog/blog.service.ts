import httpStatus from "http-status";
import AppError from "../../error/AppError";
import { prisma } from "../../DB/prisma";
import { slugify } from "../../utils/slugify";
import { UserRole } from "../../../generated/client";

const createBlog = async (
  authorId: string,
  payload: { title: string; content: string; coverImage?: string },
) => {
  const result = await prisma.blog.create({
    data: { ...payload, authorId, slug: slugify(payload.title) },
  });
  return result;
};

const getAllBlogs = async () => {
  return prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true, fullName: true } },
    },
  });
};

const getBlogById = async (id: string) => {
  const result = await prisma.blog.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, fullName: true } },
    },
  });
  if (!result) throw new AppError(httpStatus.NOT_FOUND, "Blog not found!");
  return result;
};

const assertCanModify = async (
  id: string,
  requesterId: string,
  requesterRole: UserRole,
) => {
  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) throw new AppError(httpStatus.NOT_FOUND, "Blog not found!");
  if (requesterRole !== UserRole.ADMIN && blog.authorId !== requesterId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only modify your own blogs.",
    );
  }
  return blog;
};

const updateBlog = async (
  id: string,
  requesterId: string,
  requesterRole: UserRole,
  payload: { title?: string; content?: string; coverImage?: string },
) => {
  await assertCanModify(id, requesterId, requesterRole);
  const result = await prisma.blog.update({
    where: { id },
    data: payload.title
      ? { ...payload, slug: slugify(payload.title) }
      : payload,
  });
  return result;
};

const deleteBlog = async (
  id: string,
  requesterId: string,
  requesterRole: UserRole,
) => {
  await assertCanModify(id, requesterId, requesterRole);
  await prisma.blog.delete({ where: { id } });
  return null;
};

const getLatestFiveBlog = async () => {
  const result = await prisma.blog.findMany({
    where: {},
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      author: { select: { fullName: true } },
    },
  });
  return result;
};
export const blogServices = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getLatestFiveBlog
};
