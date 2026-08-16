import { Router } from "express";
import { userRoute } from "../modules/user/user.route.js";
import { authRoute } from "../modules/auth/auth.route.js";
import { bloodRequestRoute } from "../modules/blood/blood.route.js";
import { blogRoute } from "../modules/blog/blog.route";
import { eventRoute } from "../modules/event/event.route";
import { notificationRoute } from "../modules/notification/notification.route";
import { contactRoute } from "../modules/contact/contact.route";

const router = Router();
const moduleRoute = [
  {
    path: "/user",
    route: userRoute,
  },
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/blood",
    route: bloodRequestRoute,
  },
  {
    path: "/blog",
    route: blogRoute,
  },
  {
    path: "/event",
    route: eventRoute,
  },
  { 
    path: "/notification",
    route: notificationRoute 
  },
  {
    path: "/contact",
    route: contactRoute
  }
];

moduleRoute.forEach((routeData) => router.use(routeData.path, routeData.route));

export default router;
