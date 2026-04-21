import { http, HttpResponse, delay } from "msw";
import { mockUsers } from "../data/users.data";

const tokens = new Map<string, string>();

function generateToken(userId: string): string {
  const token = btoa(
    JSON.stringify({ userId, exp: Date.now() + 3600_000 })
  );
  tokens.set(token, userId);
  return token;
}

function generateRefreshToken(userId: string): string {
  const token = btoa(
    JSON.stringify({
      userId,
      type: "refresh",
      exp: Date.now() + 86400_000 * 7,
    })
  );
  tokens.set(token, userId);
  return token;
}

function getUserFromToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return tokens.get(token) ?? null;
}

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as {
      email: string;
      password: string;
    };

    const user = mockUsers.find(
      (u) => u.email === body.email && u.password === body.password
    );

    if (!user) {
      return HttpResponse.json(
        { message: "Invalid email or password", statusCode: 401 },
        { status: 401 }
      );
    }

    const { password: _, ...safeUser } = user;

    return HttpResponse.json({
      data: {
        user: safeUser,
        accessToken: generateToken(user.id),
        refreshToken: generateRefreshToken(user.id),
      },
      message: "Login successful",
    });
  }),

  http.post("/api/auth/refresh", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { refreshToken: string };
    const userId = tokens.get(body.refreshToken);

    if (!userId) {
      return HttpResponse.json(
        { message: "Invalid refresh token", statusCode: 401 },
        { status: 401 }
      );
    }

    tokens.delete(body.refreshToken);

    return HttpResponse.json({
      data: {
        accessToken: generateToken(userId),
        refreshToken: generateRefreshToken(userId),
      },
      message: "Token refreshed",
    });
  }),

  http.get("/api/auth/me", async ({ request }) => {
    await delay(200);
    const userId = getUserFromToken(request.headers.get("Authorization"));

    if (!userId) {
      return HttpResponse.json(
        { message: "Unauthorized", statusCode: 401 },
        { status: 401 }
      );
    }

    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return HttpResponse.json(
        { message: "User not found", statusCode: 404 },
        { status: 404 }
      );
    }

    const { password: _, ...safeUser } = user;
    return HttpResponse.json({
      data: safeUser,
      message: "Success",
    });
  }),

  http.get("/api/users", async () => {
    await delay(200);
    const users = mockUsers.map(({ password: _, ...user }) => user);
    return HttpResponse.json({
      data: users,
      message: "Success",
    });
  }),
];

export { getUserFromToken };
