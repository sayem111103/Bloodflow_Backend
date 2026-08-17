import { RequestHandler } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { blogServices } from "./blog.service";

const createBlog: RequestHandler = catchAsync(async (req, res) => {
  const result = await blogServices.createBlog(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Blog created successfully",
    data: result,
  });
});

const getAllBlogs: RequestHandler = catchAsync(async (req, res) => {
  const result = await blogServices.getAllBlogs();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Blogs retrieved successfully",
    data: result,
  });
});

const getBlogById: RequestHandler = catchAsync(async (req, res) => {
  const result = await blogServices.getBlogById(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Blog retrieved successfully",
    data: result,
  });
});

const updateBlog: RequestHandler = catchAsync(async (req, res) => {
  const result = await blogServices.updateBlog(
    req.params.id as string,
    req.user.id,
    req.user.role,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Blog updated successfully",
    data: result,
  });
});

const deleteBlog: RequestHandler = catchAsync(async (req, res) => {
  await blogServices.deleteBlog(
    req.params.id as string,
    req.user.id,
    req.user.role,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Blog deleted successfully",
    data: null,
  });
});
const getLatestFiveBlog: RequestHandler = catchAsync(async (req, res) => {
  const result = await blogServices.getLatestFiveBlog();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Blog retrieved successfully",
    data: result,
  });
});

export const blogController = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getLatestFiveBlog,
};
