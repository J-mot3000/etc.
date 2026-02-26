import { Router, type Request, type Response } from "express";
import type { Product } from "../types/Products";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    // Node 18+ has fetch built in — no imports needed
    const response = await fetch(
      "https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json"
    );

    const data = (await response.json()) as Product[];
    res.json(data);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export default router;
