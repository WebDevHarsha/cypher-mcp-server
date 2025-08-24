import { NextRequest } from "next/server";
import jwt from "jsonwebtoken"; // Descope issues JWTs

export function requireRole(req: NextRequest, allowedRoles: string[]) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = auth.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, process.env.DESCOPE_JWT_SECRET!);
    if (!allowedRoles.includes(decoded.role)) {
      return { error: "Forbidden", status: 403 };
    }
    return { user: decoded };
  } catch {
    return { error: "Invalid token", status: 401 };
  }
}
