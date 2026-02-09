import {Router, Request, Response} from "express";
import bcrypt from "bcrypt"

const router = Router();


router.post("/register", (req: Request, res: Response) => {
    console.log(req.body);
    const hash = bcrypt.hashSync(req.body.password, 10);
    res.json({ status: "ok" });
    console.log(hash, bcrypt.compareSync(req.body.password, hash));
})

export default router;
