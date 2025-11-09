import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.json([{ id: 1, email: "test@example.com" }]);
});

export default router;
